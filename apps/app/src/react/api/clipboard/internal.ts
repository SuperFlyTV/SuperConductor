import { assertNever } from '@shared/lib'
import { copyGroup, copyPart, copyTimelineObj, MoveTarget } from '../../../lib/util'
import { Group } from '../../../models/rundown/Group'
import { Part } from '../../../models/rundown/Part'
import { TimelineObj } from '../../../models/rundown/TimelineObj'
import { store } from '../../mobx/store'
import { ClipBoardContext } from './lib'

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
		let target: MoveTarget
		const selected = store.guiStore.mainSelected
		if (selected) {
			target = {
				type: 'after',
				id: selected.groupId,
			}
		} else {
			target = {
				type: 'last',
			}
		}
		const insertedGroups = await context.serverAPI.insertGroups({
			rundownId: currentRundownId,
			groups: groups.map((g) => ({
				group: g,
				resources: {},
			})),
			target,
		})
		if (insertedGroups.length) {
			store.guiStore.clearSelected()
			for (const insert of insertedGroups) {
				store.guiStore.addSelected({
					type: 'group',
					groupId: insert.groupId,
				})
			}
		}
	}
	if (parts.length) {
		let target: MoveTarget
		let insertGroupId: string | null
		const selected = store.guiStore.mainSelected
		if (selected) {
			insertGroupId = selected.groupId
			if (selected.type === 'part' || selected.type === 'timelineObj') {
				target = {
					type: 'after',
					id: selected.partId,
				}
			} else {
				target = {
					type: 'last',
				}
			}
		} else {
			insertGroupId = null
			target = {
				type: 'last',
			}
		}

		const insertedParts = await context.serverAPI.insertParts({
			rundownId: currentRundownId,
			groupId: insertGroupId,
			parts: parts.map((p) => ({
				part: p,
				resources: [],
			})),
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
	if (timelineObjs.length) {
		// TODO: support pasting timelineObjs
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
