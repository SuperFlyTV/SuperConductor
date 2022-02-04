import { deepClone } from '@shared/lib'
import { ResolvedTimeline, TimelineEnable, Resolver, ResolverCache } from 'superfly-timeline'
import { TimelineObj } from '../models/rundown/TimelineObj'
import { TimelineObjectMove } from '../react/contexts/TimelineObjectMove'

export type SnapPoint = {
	timelineObjId: string
	time: number
	expression: string
}

export function applyMovementToTimeline(
	orgTimeline: TimelineObj[],
	orgResolvedTimeline: ResolvedTimeline,
	snapPoints: SnapPoint[],
	snapDistanceInMilliseconds: number,
	dragDelta: number,
	move: TimelineObjectMove,
	leaderTimelineObjId: string,
	selectedTimelineObjIds: string[],
	cache: ResolverCache | undefined
) {
	const modifiedTimeline = deepClone(orgTimeline)

	const orgLeaderObj = orgResolvedTimeline.objects[leaderTimelineObjId]
	if (!orgLeaderObj) throw new Error(`Leader obj "${leaderTimelineObjId}" not found`)
	const orgLeaderInstance = orgLeaderObj.resolved.instances[0]
	if (!orgLeaderInstance) throw new Error(`No instance of leader obj "${leaderTimelineObjId}"`)

	const orgStartTime = Math.max(0, orgLeaderInstance.start)
	const orgDuration = orgLeaderInstance.end ? orgLeaderInstance.end - orgLeaderInstance.start : null
	const orgEndTime = orgDuration ? orgStartTime + orgDuration : null

	/** [ms] */
	const movedStartTime = Math.max(0, orgStartTime + dragDelta)
	/** [ms] */
	const movedDuration = orgDuration
	const movedEndTime = movedDuration ? movedStartTime + movedDuration : null

	const closestSnapPoints: {
		distanceToSnapPoint: number
		resultingDragDelta: number
	}[] = []

	snapPoints
		.filter((sp) => {
			// Ignore own snap points.
			if (sp.timelineObjId === leaderTimelineObjId) {
				return false
			}

			// Ignore snap points belonging to other selected timeline objects.
			if (selectedTimelineObjIds.includes(sp.timelineObjId)) {
				return false
			}

			return true
		})
		.map((sp) => {
			{
				const distance = Math.abs(sp.time - movedStartTime)
				if (distance <= snapDistanceInMilliseconds) {
					closestSnapPoints.push({
						distanceToSnapPoint: distance,
						resultingDragDelta: sp.time - orgStartTime,
					})
				}
			}
			{
				if (orgEndTime && movedEndTime) {
					const distance = Math.abs(sp.time - movedEndTime)
					if (distance <= snapDistanceInMilliseconds) {
						closestSnapPoints.push({
							distanceToSnapPoint: distance,
							resultingDragDelta: sp.time - orgEndTime,
						})
					}
				}
			}
		})

	const closestSnapPoint = closestSnapPoints.reduce(
		(prev, current) => {
			if (prev.distanceToSnapPoint > current.distanceToSnapPoint) return current
			else return prev
		},
		{
			distanceToSnapPoint: Infinity,
			resultingDragDelta: 0,
		}
	)

	// Snap
	if (closestSnapPoint.distanceToSnapPoint < Infinity) {
		dragDelta = closestSnapPoint.resultingDragDelta
	}

	const applyDragDelta = (
		dragDelta: number,
		timeline: TimelineObj[]
	): { all: TimelineObj[]; changed: TimelineObj[] } => {
		const appliedTimeline: TimelineObj[] = []
		const changedObjects: TimelineObj[] = []
		for (const orgObj of timeline) {
			const obj = deepClone(orgObj)
			appliedTimeline.push(obj)
			let changed = false
			// Check if the object is selected (ie to be moved)
			if (selectedTimelineObjIds.includes(obj.obj.id)) {
				const enable = obj.obj.enable as TimelineEnable
				const orgObj = orgResolvedTimeline.objects[obj.obj.id]
				const orgInstance = orgObj.resolved.instances[0]

				if (move.moveType === 'whole') {
					if (selectedTimelineObjIds.length === 1) {
						// If the user specifically has selected the timelineObj, the object should be moved, no matter what

						enable.start = orgInstance.start + dragDelta
						if (orgInstance.end) {
							// ?
							enable.duration = orgInstance.end - orgInstance.start
							delete enable.end
						}
						changed = true
					} else {
						// Only move objects with numeric starts (ie not strings (expressions))
						if (typeof enable.start === 'number') {
							enable.start = enable.start + dragDelta
							if (orgInstance.end) {
								// ?
								enable.duration = orgInstance.end - orgInstance.start
								delete enable.end
							}
							changed = true
						}
					}
				}
			}
			if (changed) {
				changedObjects.push(obj)
			}
		}
		return { all: appliedTimeline, changed: changedObjects }
	}
	const o = applyDragDelta(dragDelta, modifiedTimeline)
	const draggedTimeline = o.all

	let changedObjects = o.changed
	let resolvedTimeline = Resolver.resolveTimeline(
		draggedTimeline.map((o) => o.obj),
		{ time: 0, cache: cache }
	)

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
		const o = applyDragDelta(dragDelta + deltaTimeAdjust, modifiedTimeline)
		const draggedTimeline2 = o.all
		changedObjects = o.changed
		// Resolve it again...
		resolvedTimeline = Resolver.resolveTimeline(
			draggedTimeline2.map((o) => o.obj),
			{ time: 0, cache: cache }
		)
	}
	return {
		resolvedTimeline,
		changedObjects,
	}
}
