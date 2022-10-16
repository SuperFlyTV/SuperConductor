import _ from 'lodash'
import { assertNever } from '@shared/lib'
import { GroupGUI } from '../../models/rundown/Group'
import { PartGUI } from '../../models/rundown/Part'
import {
	CurrentSelectionGroup,
	CurrentSelectionPart,
	CurrentSelectionTimelineObj,
	CurrentSelectionAny,
} from '../../lib/GUI'
import { RundownsStore } from '../mobx/RundownsStore'

export function sortSelected(
	rundownId: string,
	rundownsStore: RundownsStore,
	selected: CurrentSelectionGroup[]
): CurrentSelectionGroup[]
export function sortSelected(
	rundownId: string,
	rundownsStore: RundownsStore,
	selected: CurrentSelectionPart[]
): CurrentSelectionPart[]
export function sortSelected(
	rundownId: string,
	rundownsStore: RundownsStore,
	selected: CurrentSelectionTimelineObj[]
): CurrentSelectionTimelineObj[]
export function sortSelected(
	rundownId: string,
	rundownsStore: RundownsStore,
	selected: CurrentSelectionAny[]
): CurrentSelectionAny[] {
	const rundown = rundownsStore.getRundown(rundownId)
	if (!rundown) return selected

	return _.sortBy(selected, (s) => {
		let groupIndex = 0
		let group: GroupGUI | undefined
		let partIndex = 0
		let part: PartGUI | undefined
		let timelineObjIndex = 0

		if (s.type === 'group' || s.type === 'part' || s.type === 'timelineObj') {
			groupIndex = rundown.groupIds.findIndex((groupId) => groupId === s.groupId)
			if (groupIndex === -1) return Number.POSITIVE_INFINITY
			group = rundownsStore.getGroup(s.groupId)
		} else {
			assertNever(s)
		}

		if (group && (s.type === 'part' || s.type === 'timelineObj')) {
			partIndex = group.partIds.findIndex((partId) => partId === s.partId)
			if (partIndex === -1) return Number.POSITIVE_INFINITY
			part = rundownsStore.getPart(s.partId)
		}

		if (part && s.type === 'timelineObj') {
			timelineObjIndex = part.timelineIds.findIndex((objId) => objId === s.timelineObjId)
			if (timelineObjIndex === -1) return Number.POSITIVE_INFINITY
		}

		return groupIndex * 1000000 + partIndex * 100 + timelineObjIndex
	})
}
