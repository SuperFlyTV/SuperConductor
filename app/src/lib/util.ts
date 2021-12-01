import { mappingsMock } from '@/mocks/mappingsMock'
import { Group } from '@/models/rundown/Group'
import { Part } from '@/models/rundown/Part'
import { ResolvedTimeline } from 'superfly-timeline'
import { Rundown } from '@/models/rundown/Rundown'
import { TimelineObj } from '@/models/rundown/TimelineObj'

export const findGroup = (rundown: Rundown, groupId: string): Group | undefined => {
	return rundown.groups.find((g) => g.id === groupId)
}
export const findPart = (group: Group, partId: string): Part | undefined => {
	return group.parts.find((r) => r.id === partId)
}
export const findTimelineObj = (part: Part, timelineObjId: string): TimelineObj | undefined => {
	for (const timelineObj of part.timeline) {
		if (timelineObj.obj.id === timelineObjId) {
			return timelineObj
		}
	}

	return undefined
}

export const deleteGroup = (rundown: Rundown, groupId: string): void => {
	rundown.groups = rundown.groups.filter((g) => g.id !== groupId)
}
export const deletePart = (group: Group, partId: string): void => {
	const part = findPart(group, partId)

	group.parts = group.parts.filter((r) => r.id !== partId)
	if (group.playout) {
		// If we're removing the one which is playing, we need to figure out what to play instead:
		// TODO: How to handle this?

		group.playout.partIds = group.playout.partIds.filter((id) => id !== partId)
	}
}
export const deleteTimelineObj = (part: Part, timelineObjId: string): boolean => {
	if (part.timeline.find((t) => t.obj.id === timelineObjId)) {
		part.timeline = part.timeline.filter((t) => t.obj.id !== timelineObjId)
		return true
	}
	return false
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
