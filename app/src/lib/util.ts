import { mappingsMock } from '@/mocks/mappingsMock'
import { AppModel } from '@/models/AppModel'
import { GroupModel } from '@/models/GroupModel'
import { MediaModel } from '@/models/MediaModel'
import { PartModel } from '@/models/PartModel'
import { TemplateModel } from '@/models/TemplateModel'
import { ResolvedTimeline } from 'superfly-timeline'
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

export const findGroup = (appData: AppModel, groupId: string): GroupModel | undefined => {
	return appData.groups.find((g) => g.id === groupId)
}
export const findPart = (group: GroupModel, partId: string): PartModel | undefined => {
	return group.parts.find((r) => r.id === partId)
}
export const findTimelineObj = (
	appData: AppModel,
	timelineObjId: string
):
	| {
			group: GroupModel
			part: PartModel
			timelineObj: TSRTimelineObj
	  }
	| undefined => {
	// Note: This is a bit of a hack, but it works for now.
	for (const group of appData.groups) {
		for (const part of group.parts) {
			for (const timelineObj of part.timeline) {
				if (timelineObj.id === timelineObjId) {
					return { group, part, timelineObj }
				}
			}
		}
	}

	return undefined
}

export const deleteGroup = (appData: AppModel, groupId: string): void => {
	appData.groups = appData.groups.filter((g) => g.id !== groupId)
}
export const deletePart = (group: GroupModel, partId: string): void => {
	const part = findPart(group, partId)

	group.parts = group.parts.filter((r) => r.id !== partId)
	if (group.playout) {
		// If we're removing the one which is playing, we need to figure out what to play instead:
		// TODO: How to handle this?

		group.playout.partIds = group.playout.partIds.filter((id) => id !== partId)
	}
}
export const deleteTimelineObj = (
	appData: AppModel,
	timelineObjId: string
): { group: GroupModel; part: PartModel } | undefined => {
	// Note: This is a bit of a hack, but it works for now.
	for (const group of appData.groups) {
		for (const part of group.parts) {
			if (part.timeline.find((t) => t.id === timelineObjId)) {
				part.timeline = part.timeline.filter((t) => t.id !== timelineObjId)
				return { group, part }
			}
		}
	}
	return undefined
}

export const getMappingById = (id: string) => {
	return mappingsMock[id]
}

export const getResolvedTimelineTotalDuration = (resolvedTimeline: ResolvedTimeline) => {
	let maxDuration = 0
	Object.values(resolvedTimeline.objects).forEach((obj) => {
		Object.values(obj.resolved.instances).forEach((instance) => {
			if (instance.end) {
				maxDuration = Math.max(maxDuration, instance.end)
			}
		})
	})
	return maxDuration
}

/**
 * Returns a string that changes whenever the input changes.
 * Does NOT depend on the order of object attributes.
 */
export function hashObj(obj: unknown): string {
	if (!obj) {
		return ''
	} else if (Array.isArray(obj)) {
		const strs: string[] = []
		for (const value of obj) {
			strs.push(hashObj(value))
		}
		return hash(strs.join(','))
	} else if (typeof obj === 'object') {
		if (!obj) return 'null'

		// Sort the keys, so that key order doesn't matter:
		const keys = Object.keys(obj).sort((a, b) => {
			if (a > b) return 1
			if (a < b) return -1
			return 0
		})

		const strs: string[] = []
		for (const key of keys) {
			strs.push(hashObj((obj as any)[key]))
		}
		return hash(strs.join('|'))
	} else {
		return obj + ''
	}
}
export function hash(str: string): string {
	// This is not really a hash, but it's good enough for our purposes:
	return hashCode(str).toString(16)
}

function hashCode(str: string): number {
	var hash = 0
	if (str.length == 0) {
		return hash
	}
	for (var i = 0; i < str.length; i++) {
		var char = str.charCodeAt(i)

		hash = (hash << 5) - hash + char
		hash = hash & hash // Convert to 32bit integer
	}
	return hash
}
