import { AppModel } from '@/models/AppModel'
import { GroupModel } from '@/models/GroupModel'
import { PartModel } from '@/models/PartModel'
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

export function getDefaultPart(appData: AppModel):
	| {
			group: GroupModel
			part: PartModel
			name: string
	  }
	| undefined {
	return getAllParts(appData)[0]
}

export function getAllParts(appData: AppModel): {
	group: GroupModel
	part: PartModel
	name: string
}[] {
	const results: { group: GroupModel; part: PartModel; name: string }[] = []

	for (const group of appData.groups) {
		for (const part of group.parts) {
			results.push({ group, part, name: group.transparent ? part.name : `${group.name}-${part.name}` })
		}
	}

	return results
}
