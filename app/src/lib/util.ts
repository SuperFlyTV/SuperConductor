import { Rundowns } from '@/models/AppModel'
import { MediaModel } from '@/models/MediaModel'
import { TSRTimelineObj } from 'timeline-state-resolver-types'

export const findMedia = (mediaList: MediaModel[], filename: string) => {
	for (const item of mediaList) {
		if (item.filename === filename) return item
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
