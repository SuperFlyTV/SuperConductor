import { ResourceAny } from '@shared/models'
import { MoveTarget } from '../../../lib/util'
import { Project } from '../../../models/project/Project'
import { Group } from '../../../models/rundown/Group'
import { Part } from '../../../models/rundown/Part'
import { store } from '../../mobx/store'
import { IPCServer } from '../IPCServer'

export interface ClipBoardContext {
	project?: Project
	serverAPI: IPCServer
	handleError: (error: unknown) => void
}
export async function insertGroups(
	context: ClipBoardContext,
	groups: {
		group: Group
		resources: {
			[partId: string]: ResourceAny[]
		}
	}[]
) {
	const currentRundownId = store.rundownsStore.currentRundownId
	if (!currentRundownId) return false

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
		groups,
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
export async function insertParts(context: ClipBoardContext, parts: { part: Part; resources: ResourceAny[] }[]) {
	const currentRundownId = store.rundownsStore.currentRundownId
	if (!currentRundownId) return false

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
		parts: parts,
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
