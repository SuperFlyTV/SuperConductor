import { mappingsMock } from '@/mocks/mappingsMock'
import { RundownOrGroupModel } from '@/models/AppModel'
import { GroupModel } from '@/models/GroupModel'
import { MediaModel } from '@/models/MediaModel'
import { RundownModel } from '@/models/RundownModel'
import { TemplateModel } from '@/models/TemplateModel'
import { TSRTimelineObj } from 'timeline-state-resolver-types'

export const findMedia = (mediaList: MediaModel[], filename: string) => {
	for (const item of mediaList) {
		if (item.name === filename) return item
	}
}

export const findTemplate = (templateList: TemplateModel[], filename: string) => {
	for (const item of templateList) {
		if (item.name === filename) return item
	}
}

export const findRundown = (rundowns: RundownOrGroupModel[], rundownId: string): RundownModel | undefined => {
	for (const rdOrGroup of rundowns) {
		if (rdOrGroup.type === 'rundown') {
			// It's a rundown
			if (rdOrGroup.id === rundownId) {
				return rdOrGroup
			}
		} else {
			// It's a group
			const found = findRundown(rdOrGroup.rundowns, rundownId)
			if (found) {
				return found
			}
		}
	}
}

export const findGroup = (rundowns: RundownOrGroupModel[], groupId: string): GroupModel | undefined => {
	for (const rdOrGroup of rundowns) {
		if (rdOrGroup.type === 'group') {
			// It's a rundown
			if (rdOrGroup.id === groupId) {
				return rdOrGroup
			} else {
				return findGroup(rdOrGroup.rundowns, groupId)
			}
		}
	}
}

export const findTimelineObj = (rundowns: RundownOrGroupModel[], timelineObjId: string): TSRTimelineObj | undefined => {
	for (const rdOrGroup of rundowns) {
		if (rdOrGroup.type === 'rundown') {
			// It's a rundown
			for (const tObj of rdOrGroup.timeline) {
				if (tObj.id === timelineObjId) return tObj
			}
		} else {
			// It's a group
			const found = findTimelineObj(rdOrGroup.rundowns, timelineObjId)
			if (found) {
				return found
			}
		}
	}
}

export const deleteTimelineObj = (rundowns: RundownOrGroupModel[], timelineObjId: string) => {
	for (const rdOrGroup of rundowns) {
		if (rdOrGroup.type === 'rundown') {
			// It's a rundown
			rdOrGroup.timeline = rdOrGroup.timeline.filter((item) => item.id !== timelineObjId)
		} else {
			// It's a group
			deleteTimelineObj(rdOrGroup.rundowns, timelineObjId)
		}
	}
}

export const deleteRundown = (rundowns: RundownOrGroupModel[], rundownId: string): RundownOrGroupModel[] => {
	return rundowns.filter((rdOrGroup) => {
		if (rdOrGroup.type === 'rundown') {
			if (rdOrGroup.id === rundownId) {
				return false
			} else {
				return true
			}
		} else if (rdOrGroup.type === 'group') {
			rdOrGroup.rundowns = deleteRundown(rdOrGroup.rundowns, rundownId)
		}
	})
}

export const getMappingById = (id: string) => {
	return mappingsMock[id]
}
