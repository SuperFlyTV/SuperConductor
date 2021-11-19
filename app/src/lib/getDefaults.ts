import { AppModel } from '@/models/AppModel'
import { GroupModel } from '@/models/GroupModel'
import { RundownModel } from '@/models/RundownModel'
import { Mappings } from 'timeline-state-resolver-types'

export function getDefaultMappingLayer(mappings?: Mappings) {
	if (mappings) {
		// Check length
		const keys = Object.keys(mappings)
		if (keys.length <= 0) {
			return undefined
		} else {
			return keys[0]
		}
	} else {
		return undefined
	}
}

export function getDefaultRundown(appData: AppModel):
	| {
			group: GroupModel
			rundown: RundownModel
			name: string
	  }
	| undefined {
	return getAllRundowns(appData)[0]
}

export function getAllRundowns(appData: AppModel): {
	group: GroupModel
	rundown: RundownModel
	name: string
}[] {
	const results: { group: GroupModel; rundown: RundownModel; name: string }[] = []

	for (const group of appData.groups) {
		for (const rundown of group.rundowns) {
			results.push({ group, rundown, name: group.transparent ? rundown.name : `${group.name}-${rundown.name}` })
		}
	}

	return results
}
