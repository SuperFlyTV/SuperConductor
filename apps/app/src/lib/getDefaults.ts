import { Mappings } from 'timeline-state-resolver-types'

export function getDefaultMappingLayer(mappings?: Mappings): string | undefined {
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
