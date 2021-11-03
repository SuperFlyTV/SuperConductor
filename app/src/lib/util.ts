import { mappingsMock } from '@/mocks/mappingsMock'
import { Rundowns } from '@/models/AppModel'
import { MediaModel } from '@/models/MediaModel'
import { RundownModel } from '@/models/RundownModel'
import { TemplateModel } from '@/models/TemplateModel'
import { Mappings, TSRTimelineObj } from 'timeline-state-resolver-types'

export const findMedia = (mediaList: MediaModel[], filename: string) => {
	for (const item of mediaList) {
		if (item.filename === filename) return item
	}
}

export const findTemplate = (templateList: TemplateModel[], filename: string) => {
	for (const item of templateList) {
		if (item.filename === filename) return item
	}
}

export const findRundown = (rundowns: Rundowns, rundownId: string): RundownModel | undefined => {
	for (const rdOrGroup of rundowns) {
		if (rdOrGroup.type === 'rundown') {
			// It's a rundown
			if (rdOrGroup.id === rundownId) {
				return rdOrGroup
			}
		} else {
			// It's a group
			return findRundown(rdOrGroup.rundowns, rundownId)
		}
	}
}

export const findTimelineObj = (rundowns: Rundowns, timelineObjId: string): TSRTimelineObj | undefined => {
	for (const rdOrGroup of rundowns) {
		if (rdOrGroup.type === 'rundown') {
			// It's a rundown
			for (const tObj of rdOrGroup.timeline) {
				if (tObj.id === timelineObjId) return tObj
			}
		} else {
			// It's a group
			return findTimelineObj(rdOrGroup.rundowns, timelineObjId)
		}
	}
}

export const deleteTimelineObj = (rundowns: Rundowns, timelineObjId: string) => {
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

export const deleteRundown = (rundowns: Rundowns, rundownId: string): Rundowns => {
	return rundowns.filter((rdOrGroup) => {
		if (rdOrGroup.type === 'rundown') {
			if (rdOrGroup.id === rundownId) {
				// Found what to delete
				return false
			} else {
				return true
			}
		} else if (rdOrGroup.type === 'group') {
			return deleteRundown(rdOrGroup.rundowns, rundownId)
		}
	})
}

export const getMappingById = (id: string) => {
	return mappingsMock[id]
}
