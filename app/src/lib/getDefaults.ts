import { Rundowns } from '@/models/AppModel'
import { RundownModel } from '@/models/RundownModel'
import { Mappings } from 'timeline-state-resolver-types'

export const getDefaultMappingLayer = (mappings?: Mappings) => {
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

export const getDefaultRundownId = (rundowns: Rundowns): string | undefined => {
	for (const rdOrGroup of rundowns) {
		if (rdOrGroup.type === 'rundown') {
			return rdOrGroup.id
		} else {
			// It's a group
			return getDefaultRundownId(rdOrGroup.rundowns)
		}
	}
}

export const getAllRundowns = (rundowns: Rundowns): RundownModel[] => {
	const foundRundowns: RundownModel[] = []
	for (const rdOrGroup of rundowns) {
		if (rdOrGroup.type === 'rundown') {
			foundRundowns.push(rdOrGroup)
		} else {
			const groupRds = getAllRundowns(rdOrGroup.rundowns)
			foundRundowns.push(...groupRds)
		}
	}

	console.log('Found Rundowns', foundRundowns)

	return foundRundowns
}
