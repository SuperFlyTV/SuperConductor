import { Group } from '../models/rundown/Group'
import { Part } from '../models/rundown/Part'
import { ResolvedTimeline } from 'superfly-timeline'
import { Rundown } from '../models/rundown/Rundown'
import { TimelineObj } from '../models/rundown/TimelineObj'
import { getGroupPlayData, GroupPlayData } from './playhead'
import { Project } from '../models/project/Project'
import {
	DeviceOptionsAny,
	DeviceType,
	Mapping,
	MappingAtem,
	MappingAtemType,
	MappingOBS,
	MappingOBSType,
	MappingVMix,
	MappingVMixType,
} from 'timeline-state-resolver-types'
import { ResourceAny, ResourceType } from '@shared/models'
import { assertNever } from '@shared/lib'

export const findGroup = (rundown: Rundown, groupId: string): Group | undefined => {
	return rundown.groups.find((g) => g.id === groupId)
}
export const findPart = (group: Group, partId: string): Part | undefined => {
	return group.parts.find((r) => r.id === partId)
}
export const findPartInRundown = (rundown: Rundown, partId: string): { part: Part; group: Group } | undefined => {
	for (const group of rundown.groups) {
		const part = findPart(group, partId)
		if (part) {
			return { part, group }
		}
	}
	return undefined
}
export const findTimelineObj = (part: Part, timelineObjId: string): TimelineObj | undefined => {
	for (const timelineObj of part.timeline) {
		if (timelineObj.obj.id === timelineObjId) {
			return timelineObj
		}
	}

	return undefined
}
export const findTimelineObjIndex = (part: Part, timelineObjId: string): number => {
	return part.timeline.findIndex((timelineObj) => {
		return timelineObj.obj.id === timelineObjId
	})
}

export const deleteGroup = (rundown: Rundown, groupId: string): Group | undefined => {
	let deletedGroup: Group | undefined
	rundown.groups = rundown.groups.filter((g) => {
		if (g.id === groupId) {
			deletedGroup = g
			return false
		}

		return true
	})
	return deletedGroup
}
export const deletePart = (group: Group, partId: string): Part | undefined => {
	let deletedPart: Part | undefined
	group.parts = group.parts.filter((p) => {
		if (p.id === partId) {
			deletedPart = p
			return false
		}

		return true
	})
	if (group.playout) {
		// If we're removing the one which is playing, we need to figure out what to play instead:
		// TODO: How to handle this?
		delete group.playout.playingParts[partId]
	}
	return deletedPart
}
export const deleteTimelineObj = (part: Part, timelineObjId: string): boolean => {
	if (part.timeline.find((t) => t.obj.id === timelineObjId)) {
		part.timeline = part.timeline.filter((t) => t.obj.id !== timelineObjId)
		return true
	}
	return false
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

export function allowMovingItemIntoGroup(
	movedPartId: string,
	fromGroup: Group,
	toGroup: Group
): {
	now: number
	fromPlayhead: GroupPlayData
	toPlayhead: GroupPlayData
} | null {
	const isMovingToNewGroup = fromGroup.id !== toGroup.id

	const now = Date.now()
	const fromPlayhead = getGroupPlayData(fromGroup.preparedPlayData, now)
	const toPlayhead = getGroupPlayData(toGroup.preparedPlayData, now)
	const movedPartIsPlaying = fromPlayhead.playheads[movedPartId]

	if (fromGroup.locked || toGroup.locked) {
		return null
	}

	// Don't allow moving a currently-playing Part into a Group which is already playing.
	if (isMovingToNewGroup && movedPartIsPlaying && toPlayhead.groupIsPlaying) {
		return null
	}

	return {
		now,
		fromPlayhead,
		toPlayhead,
	}
}
/**
 * Update Group playing properties, so that they reflect the current playing status
 * This should not change anything for playout, but is useful to do before making changes, such as enabling loop etc..
 */
export function updateGroupPlaying(group: Group) {
	const now = Date.now()
	const playhead = getGroupPlayData(group.preparedPlayData, now)

	group.playout.playingParts = {}
	for (const [partId, playingPart] of Object.entries(playhead.playheads)) {
		group.playout.playingParts[partId] = {
			startTime: playingPart.partStartTime,
		}
	}
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
	let hash = 0
	if (str.length == 0) {
		return hash
	}
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i)

		hash = (hash << 5) - hash + char
		hash = hash & hash // Convert to 32bit integer
	}
	return hash
}

export const EMPTY_LAYER_ID_PREFIX = '__empty'

export function findDevice(bridges: Project['bridges'], deviceId: string): DeviceOptionsAny | undefined {
	for (const bridgeId in bridges) {
		const bridge = bridges[bridgeId]
		if (deviceId in bridge.settings.devices) {
			return bridge.settings.devices[deviceId]
		}
	}
}

export function listAvailableDeviceIDs(bridges: Project['bridges'], deviceType?: DeviceType): string[] {
	const deviceIds = new Set<string>()
	for (const bridgeId in bridges) {
		const bridge = bridges[bridgeId]
		for (const deviceId in bridge.settings.devices) {
			const device = bridge.settings.devices[deviceId]
			if (deviceType === undefined) {
				deviceIds.add(deviceId)
			} else if (device.type === deviceType) {
				deviceIds.add(deviceId)
			}
		}
	}
	return Array.from(deviceIds)
}

/**
 * @returns If found, the ID of the first device of the specified deviceType. Else, undefined.
 */
export function findDeviceOfType(bridges: Project['bridges'], deviceType: DeviceType): string | undefined {
	for (const bridgeId in bridges) {
		const bridge = bridges[bridgeId]
		for (const deviceId in bridge.settings.devices) {
			const device = bridge.settings.devices[deviceId]
			if (device.type === deviceType) {
				return deviceId
			}
		}
	}
}

export function getCurrentlyPlayingPartIndex(group: Group): number {
	let currentlyPlayingPartIndex = -1
	const currentlyPlayingPartId = Object.keys(group.playout.playingParts)[0]
	if (currentlyPlayingPartId) {
		currentlyPlayingPartIndex = group.parts.findIndex((p) => p.id === currentlyPlayingPartId)
	}
	return currentlyPlayingPartIndex
}

/**
 * @returns The index of the part which will be played next. Skips disabled parts. Returns -1 if there is no next part to play.
 */
export function getNextPartIndex(group: Group): number {
	const currentPartIndex = getCurrentlyPlayingPartIndex(group)
	for (let i = currentPartIndex + 1; i < group.parts.length; i++) {
		const part = group.parts[i]
		if (!part.disabled) {
			return i
		}
	}
	return -1
}

/**
 * @returns The index of the part which will was previously played. Skips disabled parts. Returns -1 if there is no previous part.
 */
export function getPrevPartIndex(group: Group): number {
	const currentPartIndex = getCurrentlyPlayingPartIndex(group)
	for (let i = currentPartIndex - 1; i > -1; i--) {
		const part = group.parts[i]
		if (!part.disabled) {
			return i
		}
	}
	return -1
}

/**
 * @returns True if the resource can be added to the layer/mapping, false if not.
 */
export function allowAddingResourceToLayer(project: Project, resource: ResourceAny, mapping: Mapping): boolean {
	const resourceDevice = findDevice(project.bridges, resource.deviceId)
	if (!resourceDevice) {
		return false
	}

	if (mapping.device === DeviceType.ABSTRACT) {
		return false
	} else if (mapping.device === DeviceType.ATEM) {
		const mapping0 = mapping as MappingAtem
		if (mapping0.mappingType === MappingAtemType.AudioChannel) {
			return resource.resourceType === ResourceType.ATEM_AUDIO_CHANNEL
		} else if (mapping0.mappingType === MappingAtemType.Auxilliary) {
			return resource.resourceType === ResourceType.ATEM_AUX
		} else if (mapping0.mappingType === MappingAtemType.DownStreamKeyer) {
			return resource.resourceType === ResourceType.ATEM_DSK
		} else if (mapping0.mappingType === MappingAtemType.MacroPlayer) {
			return resource.resourceType === ResourceType.ATEM_MACRO_PLAYER
		} else if (mapping0.mappingType === MappingAtemType.MediaPlayer) {
			return resource.resourceType === ResourceType.ATEM_MEDIA_PLAYER
		} else if (mapping0.mappingType === MappingAtemType.MixEffect) {
			return resource.resourceType === ResourceType.ATEM_ME
		} else if (mapping0.mappingType === MappingAtemType.SuperSourceBox) {
			return resource.resourceType === ResourceType.ATEM_SSRC
		} else if (mapping0.mappingType === MappingAtemType.SuperSourceProperties) {
			return resource.resourceType === ResourceType.ATEM_SSRC_PROPS
		} else {
			assertNever(mapping0.mappingType)
		}
	} else if (mapping.device === DeviceType.CASPARCG) {
		return (
			resource.resourceType === ResourceType.CASPARCG_MEDIA ||
			resource.resourceType === ResourceType.CASPARCG_TEMPLATE
		)
	} else if (mapping.device === DeviceType.HTTPSEND) {
		// @TODO
		return false
	} else if (mapping.device === DeviceType.HTTPWATCHER) {
		// @TODO
		return false
	} else if (mapping.device === DeviceType.HYPERDECK) {
		// @TODO
		return false
	} else if (mapping.device === DeviceType.LAWO) {
		// @TODO
		return false
	} else if (mapping.device === DeviceType.OBS) {
		const mapping0 = mapping as MappingOBS
		if (mapping0.mappingType === MappingOBSType.CurrentScene) {
			return resource.resourceType === ResourceType.OBS_SCENE
		} else if (mapping0.mappingType === MappingOBSType.CurrentTransition) {
			return resource.resourceType === ResourceType.OBS_TRANSITION
		} else if (mapping0.mappingType === MappingOBSType.Mute) {
			return resource.resourceType === ResourceType.OBS_MUTE
		} else if (mapping0.mappingType === MappingOBSType.Recording) {
			return resource.resourceType === ResourceType.OBS_RECORDING
		} else if (mapping0.mappingType === MappingOBSType.SceneItemRender) {
			return resource.resourceType === ResourceType.OBS_RENDER
		} else if (mapping0.mappingType === MappingOBSType.SourceSettings) {
			return resource.resourceType === ResourceType.OBS_SOURCE_SETTINGS
		} else if (mapping0.mappingType === MappingOBSType.Streaming) {
			return resource.resourceType === ResourceType.OBS_STREAMING
		} else {
			assertNever(mapping0.mappingType)
		}
	} else if (mapping.device === DeviceType.OSC) {
		// @TODO
		return false
	} else if (mapping.device === DeviceType.PANASONIC_PTZ) {
		// @TODO
		return false
	} else if (mapping.device === DeviceType.PHAROS) {
		// @TODO
		return false
	} else if (mapping.device === DeviceType.QUANTEL) {
		// @TODO
		return false
	} else if (mapping.device === DeviceType.SHOTOKU) {
		// @TODO
		return false
	} else if (mapping.device === DeviceType.SINGULAR_LIVE) {
		// @TODO
		return false
	} else if (mapping.device === DeviceType.SISYFOS) {
		// @TODO
		return false
	} else if (mapping.device === DeviceType.TCPSEND) {
		// @TODO
		return false
	} else if (mapping.device === DeviceType.VIZMSE) {
		// @TODO
		return false
	} else if (mapping.device === DeviceType.VMIX) {
		const mapping0 = mapping as MappingVMix
		if (mapping0.mappingType === MappingVMixType.AudioChannel) {
			return resource.resourceType === ResourceType.VMIX_AUDIO_SETTINGS
		} else if (mapping0.mappingType === MappingVMixType.External) {
			return false
		} else if (mapping0.mappingType === MappingVMixType.FadeToBlack) {
			return false
		} else if (mapping0.mappingType === MappingVMixType.Fader) {
			return false
		} else if (mapping0.mappingType === MappingVMixType.Input) {
			return resource.resourceType === ResourceType.VMIX_INPUT_SETTINGS
		} else if (mapping0.mappingType === MappingVMixType.Output) {
			return resource.resourceType === ResourceType.VMIX_OUTPUT_SETTINGS
		} else if (mapping0.mappingType === MappingVMixType.Overlay) {
			return resource.resourceType === ResourceType.VMIX_OVERLAY_SETTINGS
		} else if (mapping0.mappingType === MappingVMixType.Preview) {
			return resource.resourceType === ResourceType.VMIX_INPUT
		} else if (mapping0.mappingType === MappingVMixType.Program) {
			return resource.resourceType === ResourceType.VMIX_INPUT
		} else if (mapping0.mappingType === MappingVMixType.Recording) {
			return false
		} else if (mapping0.mappingType === MappingVMixType.Streaming) {
			return false
		} else {
			assertNever(mapping0.mappingType)
		}
	} else {
		assertNever(mapping.device)
	}

	return mapping.device === resourceDevice.type
}
