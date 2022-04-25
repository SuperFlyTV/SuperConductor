import { deepClone } from '@shared/lib'
import { ResolvedTimeline, TimelineEnable, Resolver, ResolverCache, TimelineObjectInstance } from 'superfly-timeline'
import { TimelineObj } from '../models/rundown/TimelineObj'
import { TimelineObjectMove } from '../react/mobx/GuiStore'
import { shortID } from './util'

const MIN_DURATION = 1

export type SnapPoint = {
	timelineObjId: string
	time: number
	expression: string
	/** string, containing t ids of which other objects this snapPoint is referring. Used to filter out snapPoints that would cause circular dependencies */
	referring: string
}
interface DragSnap {
	timelineObjId: string
	expression: string
	type: 'start' | 'end'
}

export function applyMovementToTimeline(
	orgTimeline: TimelineObj[],
	orgResolvedTimeline: ResolvedTimeline,
	snapPoints: SnapPoint[],
	snapDistanceInMilliseconds: number,
	dragDelta: number,
	moveType: TimelineObjectMove['moveType'],
	leaderTimelineObjId: string,
	selectedTimelineObjIds: string[],
	cache: ResolverCache | undefined,
	leaderTimelineObjNewLayer: string | null,
	duplicate: boolean
): {
	modifiedTimeline: TimelineObj[]
	resolvedTimeline: ResolvedTimeline
	changedObjects: { [objectId: string]: TimelineObj } | null
	duplicatedObjects: { [objectId: string]: TimelineObj } | null
} {
	if (selectedTimelineObjIds.length > 1 || moveType !== 'whole') {
		// Don't allow layer changes when moving more than one timelineObj OR if not doing a "whole" type move
		leaderTimelineObjNewLayer = null
	}

	if (Math.round(dragDelta) === 0 && !leaderTimelineObjNewLayer) {
		// Fast-track: If dragDelta is zero, we can return the original, since no change is needed
		return {
			modifiedTimeline: orgTimeline,
			resolvedTimeline: orgResolvedTimeline,
			changedObjects: null,
			duplicatedObjects: null,
		}
	}

	let changedObjects: { [objectId: string]: TimelineObj } = {}
	const duplicatedObjects: { [objectId: string]: TimelineObj } = {}
	const modifiedTimeline = deepClone(orgTimeline)

	if (duplicate) {
		const dupes = []
		for (const timelineObj of modifiedTimeline) {
			if (selectedTimelineObjIds.includes(timelineObj.obj.id)) {
				const clone = deepClone(timelineObj)
				clone.obj.id = shortID()
				dupes.push(clone)
			}
		}

		for (const dupe of dupes) {
			modifiedTimeline.push(dupe)
			duplicatedObjects[dupe.obj.id] = dupe
		}
	}

	const orgLeaderObj = orgResolvedTimeline.objects[leaderTimelineObjId]
	if (!orgLeaderObj) throw new Error(`Leader obj "${leaderTimelineObjId}" not found`)
	const orgLeaderInstance = orgLeaderObj.resolved.instances[0] as TimelineObjectInstance | undefined
	if (!orgLeaderInstance) throw new Error(`No instance of leader obj "${leaderTimelineObjId}"`)

	// Moving a timelineObj to another layer:
	const modifiedLeaderObj = modifiedTimeline.find((o) => o.obj.id === leaderTimelineObjId)
	if (modifiedLeaderObj && leaderTimelineObjNewLayer && modifiedLeaderObj.obj.layer !== leaderTimelineObjNewLayer) {
		modifiedLeaderObj.obj.layer = leaderTimelineObjNewLayer
		changedObjects[modifiedLeaderObj.obj.id] = modifiedLeaderObj
	}

	const orgStartTime = Math.max(0, orgLeaderInstance.start)

	/** [ms] */
	const movedStartTime = Math.max(0, orgStartTime + dragDelta)

	let dragSnap: DragSnap | null = null

	const closestSnapPoints: {
		distanceToSnapPoint: number
		resultingDragDelta: number
		expression: string
		type: 'start' | 'end'
	}[] = []

	const validSnapPoints = snapPoints.filter((sp) => {
		// Ignore own snap points.
		if (sp.timelineObjId === leaderTimelineObjId) {
			return false
		}

		// Ignore snap points belonging to other selected timeline objects.
		if (selectedTimelineObjIds.includes(sp.timelineObjId)) {
			return false
		}

		// Ignore snap points that are referring to the moved timeline object.
		if (sp.referring.includes(leaderTimelineObjId)) {
			return false
		}

		return true
	})
	validSnapPoints.forEach((sp) => {
		{
			const distance = Math.abs(sp.time - movedStartTime)
			if (distance <= snapDistanceInMilliseconds) {
				closestSnapPoints.push({
					distanceToSnapPoint: distance,
					resultingDragDelta: sp.time - orgStartTime,
					expression: sp.expression,
					type: 'start',
				})
			}
		}
		// Because SuperTimeline doesn't support support setting the end+duration, this case is not supported.
		// {
		// 	if (orgEndTime && movedEndTime) {
		// 		const distance = Math.abs(sp.time - movedEndTime)
		// 		if (distance <= snapDistanceInMilliseconds) {
		// 			closestSnapPoints.push({
		// 				distanceToSnapPoint: distance,
		// 				resultingDragDelta: sp.time - orgEndTime,
		// 				expression: sp.expression,
		// 				type: 'end',
		// 			})
		// 		}
		// 	}
		// }
	})

	const closestSnapPoint = closestSnapPoints.reduce(
		(prev, current) => {
			if (prev.distanceToSnapPoint > current.distanceToSnapPoint) return current
			else return prev
		},
		{
			distanceToSnapPoint: Infinity,
			resultingDragDelta: 0,
			expression: '',
			type: 'start',
		}
	)

	// Snap
	if (closestSnapPoint.distanceToSnapPoint < Infinity) {
		dragDelta = closestSnapPoint.resultingDragDelta

		dragSnap = {
			timelineObjId: leaderTimelineObjId,
			expression: closestSnapPoint.expression,
			type: closestSnapPoint.type,
		}
	}
	if (Math.round(dragDelta) === 0 && !leaderTimelineObjNewLayer) {
		// Fast-track: If dragDelta is zero, we can return the original, since no change is needed
		return {
			modifiedTimeline: orgTimeline,
			resolvedTimeline: orgResolvedTimeline,
			changedObjects: null,
			duplicatedObjects: null,
		}
	}

	const o = applyDragDelta(
		dragDelta,
		modifiedTimeline,
		selectedTimelineObjIds,
		moveType,
		orgResolvedTimeline,
		dragSnap
	)
	const draggedTimeline = o.all

	changedObjects = { ...changedObjects, ...o.changed }
	let resolvedTimeline: ResolvedTimeline

	try {
		resolvedTimeline = Resolver.resolveTimeline(
			draggedTimeline.map((o) => o.obj),
			{ time: 0, cache: cache }
		)
	} catch (e) {
		console.error(dragDelta)
		console.error(o)
		throw e
	}

	// Go through all objects, making sure that none of them starts before 0
	let deltaTimeAdjust = 0
	for (const obj of Object.values(resolvedTimeline.objects)) {
		for (const instance of obj.resolved.instances) {
			if (instance.start < 0) {
				deltaTimeAdjust = Math.max(deltaTimeAdjust, -instance.start)
			}
		}
	}
	if (deltaTimeAdjust) {
		dragDelta = dragDelta + deltaTimeAdjust

		if (Math.round(dragDelta) === 0 && !leaderTimelineObjNewLayer) {
			// Fast-track: If dragDelta is zero, we can return the original, since no change is needed
			return {
				modifiedTimeline: orgTimeline,
				resolvedTimeline: orgResolvedTimeline,
				changedObjects: null,
				duplicatedObjects: null,
			}
		}

		const o = applyDragDelta(
			dragDelta,
			modifiedTimeline,
			selectedTimelineObjIds,
			moveType,
			orgResolvedTimeline,
			dragSnap
		)
		const draggedTimeline2 = o.all
		changedObjects = { ...changedObjects, ...o.changed }
		// Resolve it again...
		try {
			resolvedTimeline = Resolver.resolveTimeline(
				draggedTimeline2.map((o) => o.obj),
				{ time: 0, cache: cache }
			)
		} catch (e) {
			console.error(dragDelta)
			console.error(o)
			throw e
		}
	}
	return {
		modifiedTimeline,
		resolvedTimeline,
		changedObjects,
		duplicatedObjects,
	}
}

function applyDragDelta(
	/** [ms] */
	dragDelta: number,
	timeline: TimelineObj[],
	selectedTimelineObjIds: string[],
	moveType: TimelineObjectMove['moveType'],
	orgResolvedTimeline: ResolvedTimeline,
	dragSnap: DragSnap | null
): { all: TimelineObj[]; changed: { [objectId: string]: TimelineObj } } {
	const appliedTimeline: TimelineObj[] = []
	const changedObjects: { [objectId: string]: TimelineObj } = {}
	for (const orgObj of timeline) {
		const obj = deepClone(orgObj)
		appliedTimeline.push(obj)
		let changed = false
		// Check if the object isselected (ie to be moved)
		if (selectedTimelineObjIds.includes(obj.obj.id)) {
			const enable = obj.obj.enable as TimelineEnable
			const orgResolvedObj = orgResolvedTimeline.objects[obj.obj.id]
			const orgInstance = orgResolvedObj.resolved.instances[0] as TimelineObjectInstance | undefined
			if (!orgInstance) continue

			if (moveType === 'whole') {
				if (
					// If the user specifically has selected ONLY the timelineObj, the object should be moved, no matter what:
					selectedTimelineObjIds.length === 1 ||
					// Otherwise, only move objects with numeric starts (ie not strings (expressions))
					typeof enable.start === 'number'
				) {
					delete enable.start
					delete enable.end
					delete enable.duration
					delete enable.while

					changed = true
					if (dragSnap?.timelineObjId === obj.obj.id) {
						if (dragSnap.type === 'start') {
							enable.start = dragSnap.expression
						} else if (dragSnap.type === 'end') {
							enable.end = dragSnap.expression
						}
					} else {
						enable.start = Math.round(orgInstance.start + dragDelta)
					}

					if (orgInstance.end) {
						// Set the duration to a specific value (ie overwrite any previous duration expression)
						enable.duration = Math.round(orgInstance.end - orgInstance.start)
					} else {
						// Is infinite
						if (enable.end) {
							enable.start = 0
						} else {
							enable.end = null
						}
					}
				}
			} else if (moveType === 'start') {
				if (
					// If the user specifically has selected ONLY the timelineObj, the object should be moved, no matter what:
					selectedTimelineObjIds.length === 1 ||
					// Otherwise, only move objects with numeric starts (ie not strings (expressions))
					typeof enable.start === 'number'
				) {
					delete enable.start
					delete enable.end
					delete enable.duration
					delete enable.while

					changed = true
					if (dragSnap?.timelineObjId === obj.obj.id) {
						if (dragSnap.type === 'start') {
							enable.start = dragSnap.expression
						} else if (dragSnap.type === 'end') {
							// Shouldn't be possible to end up here?
						}
					} else {
						enable.start = Math.round(orgInstance.start + dragDelta)
					}

					if (orgInstance.end) {
						enable.duration = Math.max(
							MIN_DURATION,
							Math.round(orgInstance.end - orgInstance.start - dragDelta)
						)
					} else {
						// Is infinite
						if (enable.end) {
							enable.start = 0
						} else {
							enable.end = null
						}
					}
				}
			} else if (moveType === 'duration') {
				if (
					// If the user specifically has selected ONLY the timelineObj, the object should be moved, no matter what:
					selectedTimelineObjIds.length === 1 ||
					// Otherwise, only move objects with numeric starts (ie not strings (expressions))
					typeof enable.start === 'number'
				) {
					delete enable.end
					delete enable.duration
					delete enable.while

					changed = true
					if (dragSnap?.timelineObjId === obj.obj.id) {
						if (dragSnap.type === 'start') {
							// Shouldn't be possible to end up here?
						} else if (dragSnap.type === 'end') {
							enable.end = dragSnap.expression
						}
					}

					if (orgInstance.end) {
						enable.duration = Math.max(
							MIN_DURATION,
							Math.round(orgInstance.end - orgInstance.start + dragDelta)
						)
					} else {
						// Is infinite
						if (enable.end) {
							enable.start = 0
						} else {
							enable.end = null
						}
					}
				}
			}
		}
		if (changed) {
			changedObjects[obj.obj.id] = obj
		}
	}
	return { all: appliedTimeline, changed: changedObjects }
}
