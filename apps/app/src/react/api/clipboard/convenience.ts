import { literal } from '@shared/lib'
import { CasparCGTemplate, ResourceAny, ResourceType } from '@shared/models'
import { DeviceType } from 'timeline-state-resolver-types'
import { getDefaultPart } from '../../../lib/defaults'
import { sortMappings } from '../../../lib/TSRMappings'
import { shortID } from '../../../lib/util'
import { Part } from '../../../models/rundown/Part'
import { ClipBoardContext, insertParts } from './lib'
import { transformURL } from './transformURL'

/**
 * Handle various pasted data that might be useful for the user to be able to past
 * Returns true if able to handle the incoming data
 */
export async function handleConvenience(context: ClipBoardContext, str: string): Promise<boolean> {
	if (await handleURL(context, str)) return true

	return false
}

export async function handleURL(context: ClipBoardContext, str: string): Promise<boolean> {
	let url = makeURL(str)
	if (!url) return false

	url = transformURL(url)

	if (!context.project) return false

	const parts: { part: Part; resources: ResourceAny[] }[] = []

	const sortedMappings = sortMappings(context.project.mappings)
	for (const mapping of sortedMappings) {
		// Url:s can be played by CasparCG, check if one is available:
		if (mapping.mapping.device === DeviceType.CASPARCG) {
			const part: Part = {
				...getDefaultPart(),
				id: shortID(),
				name: '',
			}
			const resource = literal<CasparCGTemplate>({
				deviceId: mapping.mapping.deviceId,
				id: shortID(),
				displayName: url.hostname,
				resourceType: ResourceType.CASPARCG_TEMPLATE,
				size: 0,
				name: url.href,
				changed: Date.now(),
				useStopCommand: false,

				duration: null,
			})

			parts.push({ part, resources: [resource] })
			break
		}
	}

	if (parts.length) {
		await insertParts(context, parts)
	}

	return true
}

function makeURL(str: string): URL | null {
	try {
		return new URL(str)
	} catch {
		return null
	}
}
