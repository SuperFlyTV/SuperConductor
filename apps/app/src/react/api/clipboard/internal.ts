import { assertNever } from '@shared/lib'
import { getDefaultPart } from '../../../lib/defaults'
import { copyGroup, copyPart, copyTimelineObj, MoveTarget, shortID } from '../../../lib/util'
import { Group } from '../../../models/rundown/Group'
import { Part } from '../../../models/rundown/Part'
import { TimelineObj } from '../../../models/rundown/TimelineObj'
import { store } from '../../mobx/store'
import { ClipBoardContext, insertGroups, insertParts } from './lib'

/**
 * Handle pasted data from the SuperConductor
 * Returns true if able to handle the incoming data
 */
export async function handleInternal(context: ClipBoardContext, str: string): Promise<boolean> {
	if (!str.startsWith('{"type":"SuperConductor"')) return false
	const currentRundownId = store.rundownsStore.currentRundownId
	if (!currentRundownId) return false

	let data: ClipBoardInternal | undefined = undefined
	try {
		data = JSON.parse(str)
	} catch (_err) {
		// unable to parse, fo nothing
		return false
	}
	if (!data) return false
	if (data.type !== 'SuperConductor') return false
	if (!Array.isArray(data.items)) return false

	const groups: Group[] = []
	const parts: Part[] = []
	const timelineObjs: TimelineObj[] = []

	for (const item of data.items) {
		if (item.type === 'group') {
			groups.push(copyGroup(item.group))
		} else if (item.type === 'part') {
			parts.push(copyPart(item.part))
		} else if (item.type === 'timelineObj') {
			timelineObjs.push(copyTimelineObj(item.timelineObj))
		} else {
			assertNever(item)
		}
	}

	if (groups.length) {
		await insertGroups(
			context,

			groups.map((g) => ({
				group: g,
				resources: {},
			}))
		)
	}
	if (parts.length) {
		await insertParts(
			context,

			parts.map((p) => ({
				part: p,
				resources: [],
			}))
		)
	}
	if (timelineObjs.length) {
		let insertGroupId: string | null
		const selected = store.guiStore.mainSelected
		if (selected && (selected.type === 'timelineObj' || selected.type === 'part')) {
			insertGroupId = selected.groupId
			const insertPartId = selected.partId

			let target: MoveTarget

			if (selected.type === 'timelineObj') {
				target = {
					type: 'after',
					id: selected.timelineObjId,
				}
				// Put the inserted objs on the same layer:
				const selectedTimelineObj = store.rundownsStore.getTimelineObj(selected.timelineObjId)
				for (const timelineObj of timelineObjs) {
					timelineObj.obj.layer = selectedTimelineObj.obj.layer
				}
			} else if (selected.type === 'part') {
				target = {
					type: 'last',
				}
				// Put the inserted objs on new layers:
				for (const timelineObj of timelineObjs) {
					timelineObj.obj.layer = ''
				}
			} else {
				assertNever(selected)
				target = {
					type: 'last',
				}
			}

			const insertedObjs = await context.serverAPI.insertTimelineObjs({
				rundownId: currentRundownId,
				groupId: insertGroupId,
				partId: insertPartId,
				timelineObjs: timelineObjs,
				target,
			})
			if (insertedObjs.length) {
				store.guiStore.clearSelected()
				for (const insert of insertedObjs) {
					store.guiStore.addSelected({
						type: 'timelineObj',
						groupId: insert.groupId,
						partId: insert.partId,
						timelineObjId: insert.timelineObjId,
					})
				}
			}
		} else {
			let target: MoveTarget
			if (selected && selected.type === 'group') {
				insertGroupId = selected.groupId
				target = {
					type: 'last',
				}
			} else {
				insertGroupId = null
				target = {
					type: 'last',
				}
			}

			const part: Part = {
				...getDefaultPart(),
				name: '',
				id: shortID(),
				timeline: timelineObjs,
			}

			const insertedParts = await context.serverAPI.insertParts({
				rundownId: currentRundownId,
				groupId: insertGroupId,
				parts: [
					{
						part: part,
						resources: [],
					},
				],
				target,
			})
			if (insertedParts.length) {
				store.guiStore.clearSelected()
				for (const insert of insertedParts) {
					store.guiStore.addSelected({
						type: 'part',
						groupId: insert.groupId,
						partId: insert.partId,
					})
				}
			}
		}
	}

	return true
}

export interface ClipBoardInternal {
	type: 'SuperConductor'
	items: ClipBoardInternalAny[]
}
export type ClipBoardInternalAny = ClipBoardInternalGroup | ClipBoardInternalPart | ClipBoardInternalTimelineObj
export interface ClipBoardInternalGroup {
	type: 'group'
	group: Group
}
export interface ClipBoardInternalPart {
	type: 'part'
	groupId: string
	part: Part
}
export interface ClipBoardInternalTimelineObj {
	type: 'timelineObj'
	groupId: string
	partId: string
	timelineObj: TimelineObj
}
