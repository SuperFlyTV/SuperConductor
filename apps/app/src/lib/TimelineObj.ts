import {
	DeviceType,
	MediaSourceType,
	TimelineContentTypeAtem,
	TimelineContentTypeCasparCg,
	TimelineContentTypeOBS,
	TimelineContentTypePharos,
	TimelineContentTypeVMix,
	TSRTimelineObj,
} from 'timeline-state-resolver-types'
import { assertNever } from '@shared/lib'
import { GroupPreparedPlayDataPart } from '../models/GUI/PreparedPlayhead'
import { TimelineObj } from '../models/rundown/TimelineObj'

export function describeTimelineObject(obj: TSRTimelineObj) {
	let label: string = obj.id
	if (obj.content.deviceType === DeviceType.CASPARCG) {
		if (obj.content.type === TimelineContentTypeCasparCg.MEDIA) {
			label = obj.content.file
		} else if (obj.content.type === TimelineContentTypeCasparCg.TEMPLATE) {
			label = obj.content.name

			if (obj.content.data) {
				let parsed: { [key: string]: string } = {}
				if (typeof obj.content.data !== 'object') {
					try {
						parsed = JSON.parse(obj.content.data)
					} catch (_err) {
						// ignore parse error
					}
				} else {
					parsed = obj.content.data
				}

				if (parsed) {
					label += ' ' + Object.values(parsed).join(', ')
				}
			}
		} else {
			// todo: for later:
			// assertNever(obj.content)
		}
	} else if (obj.content.deviceType === DeviceType.ATEM) {
		if (obj.content.type === TimelineContentTypeAtem.ME) {
			label = `Input ${obj.content.me.input}`
		} else if (obj.content.type === TimelineContentTypeAtem.DSK) {
			label = `Fill ${obj.content.dsk.sources?.fillSource} / Cut ${obj.content.dsk.sources?.cutSource}`
		} else if (obj.content.type === TimelineContentTypeAtem.AUX) {
			label = `Input ${obj.content.aux.input}`
		} else if (obj.content.type === TimelineContentTypeAtem.SSRC) {
			label = `SSrc Box`
		} else if (obj.content.type === TimelineContentTypeAtem.SSRCPROPS) {
			label = `SSrc Props`
		} else if (obj.content.type === TimelineContentTypeAtem.MACROPLAYER) {
			label = `Macro ${obj.content.macroPlayer.macroIndex}`
		} else if (obj.content.type === TimelineContentTypeAtem.AUDIOCHANNEL) {
			label = `Audio Channel Props`
		} else if (obj.content.type === TimelineContentTypeAtem.MEDIAPLAYER) {
			if (obj.content.mediaPlayer.sourceType === MediaSourceType.Clip) {
				label = `Clip ${obj.content.mediaPlayer.clipIndex}`
			} else if (obj.content.mediaPlayer.sourceType === MediaSourceType.Still) {
				label = `Still ${obj.content.mediaPlayer.stillIndex}`
			} else {
				assertNever(obj.content.mediaPlayer.sourceType)
			}
		} else {
			assertNever(obj.content)
		}
	} else if (obj.content.deviceType === DeviceType.OBS) {
		if (obj.content.type === TimelineContentTypeOBS.CURRENT_SCENE) {
			label = obj.content.sceneName
		} else if (obj.content.type === TimelineContentTypeOBS.CURRENT_TRANSITION) {
			label = obj.content.transitionName
		} else if (obj.content.type === TimelineContentTypeOBS.MUTE) {
			label = `Mute ${obj.content.mute ? 'On' : 'Off'}`
		} else if (obj.content.type === TimelineContentTypeOBS.RECORDING) {
			label = `Recording ${obj.content.on ? 'On' : 'Off'}`
		} else if (obj.content.type === TimelineContentTypeOBS.SCENE_ITEM_RENDER) {
			label = `Render ${obj.content.on ? 'On' : 'Off'}`
		} else if (obj.content.type === TimelineContentTypeOBS.SOURCE_SETTINGS) {
			label = 'Source Settings'
		} else if (obj.content.type === TimelineContentTypeOBS.STREAMING) {
			label = `Stream ${obj.content.on ? 'On' : 'Off'}`
		} else {
			assertNever(obj.content)
		}
	} else if (obj.content.deviceType === DeviceType.VMIX) {
		if (obj.content.type === TimelineContentTypeVMix.AUDIO) {
			label = 'Audio Settings'
		} else if (obj.content.type === TimelineContentTypeVMix.EXTERNAL) {
			label = `External ${obj.content.on ? 'On' : 'Off'}`
		} else if (obj.content.type === TimelineContentTypeVMix.FADER) {
			label = `Fader Level ${obj.content.position}/255`
		} else if (obj.content.type === TimelineContentTypeVMix.FADE_TO_BLACK) {
			label = `FTB ${obj.content.on ? 'On' : 'Off'}`
		} else if (obj.content.type === TimelineContentTypeVMix.INPUT) {
			label = 'Input Settings'
		} else if (obj.content.type === TimelineContentTypeVMix.OUTPUT) {
			if (obj.content.source === 'Preview') {
				label = 'Preview'
			} else if (obj.content.source === 'Program') {
				label = 'Program'
			} else if (obj.content.source === 'MultiView') {
				label = 'MultiView'
			} else if (obj.content.source === 'Input') {
				label = `Input ${obj.content.input}`
			} else {
				assertNever(obj.content.source)
			}
		} else if (obj.content.type === TimelineContentTypeVMix.OVERLAY) {
			label = `Input #${obj.content.input}`
		} else if (obj.content.type === TimelineContentTypeVMix.PREVIEW) {
			label = `Input ${obj.content.input}`
		} else if (obj.content.type === TimelineContentTypeVMix.PROGRAM) {
			label = `Input ${obj.content.input}`
		} else if (obj.content.type === TimelineContentTypeVMix.RECORDING) {
			label = `Recording ${obj.content.on ? 'On' : 'Off'}`
		} else if (obj.content.type === TimelineContentTypeVMix.STREAMING) {
			label = `Stream ${obj.content.on ? 'On' : 'Off'}`
		} else {
			assertNever(obj.content)
		}
	} else if (obj.content.deviceType === DeviceType.OSC) {
		label = obj.content.path
	} else if (obj.content.deviceType === DeviceType.HTTPSEND) {
		label = `${obj.content.type.toUpperCase()} ${obj.content.url}`
	} else {
		// todo: for later:
		// assertNever(obj.content)
	}

	// @ts-expect-error type
	const type: string = obj.content.type
	const contentTypeClassNames: string[] = [`device-${DeviceType[obj.content.deviceType]}`, type]

	return {
		label,
		contentTypeClassNames,
	}
}

/** Prepare timelineObject for the playout timeline.
 * Modifies the provided object
 */
export function modifyTimelineObjectForPlayout(
	obj: TSRTimelineObj,
	playingPart: GroupPreparedPlayDataPart,
	orgTimelineObj: TimelineObj,
	pauseTime: number | undefined
): void {
	let isPaused = false
	if (pauseTime !== undefined) {
		// is paused

		// Convert the timing of the timeline object to a infinite, paused object:
		isPaused = true

		// Check if the object exists at the time of pauseTime:
		let existsAtPauseTime = false
		for (const instance of orgTimelineObj.resolved.instances) {
			if (instance.start <= pauseTime && (instance.end ?? Infinity) >= pauseTime) {
				existsAtPauseTime = true
				break
			}
		}

		if (existsAtPauseTime) {
			obj.enable = { start: 0 }
		} else {
			obj.enable = { while: 0 }
		}
	} else {
		pauseTime = 0
	}

	if (obj.content.deviceType === DeviceType.CASPARCG) {
		if (obj.content.type === TimelineContentTypeCasparCg.MEDIA) {
			if (isPaused) {
				obj.content.pauseTime = playingPart.startTime + pauseTime
				obj.content.playing = false
			}
		}
		if (obj.content.type === TimelineContentTypeCasparCg.TEMPLATE) {
			if (
				(obj.content as any).sendDataAsXML ||
				(obj.content as any).casparXMLData // backwards compatibility
			) {
				let data = obj.content.data
				if (typeof data === 'string') {
					try {
						data = JSON.parse(data)
					} catch (_err) {
						// unable to parse, do nothing
					}
				}
				if (typeof data === 'object') {
					obj.content.data = parametersToCasparXML(data)
				}
			}
		}
	} else if (obj.content.deviceType === DeviceType.PHAROS) {
		if (obj.content.type === TimelineContentTypePharos.TIMELINE) {
			if (isPaused) {
				obj.content.pause = true
			}
		}
	} else if (obj.content.deviceType === DeviceType.QUANTEL) {
		if (isPaused) {
			obj.content.pauseTime = playingPart.startTime + pauseTime
			obj.content.playing = false
		}
	} else if (obj.content.deviceType === DeviceType.VMIX) {
		if (obj.content.type === TimelineContentTypeVMix.INPUT) {
			if (isPaused) {
				obj.content.playing = false
				// obj.content.pauseTime = playingPart.startTime - pauseTime
			}
		}
	}
}
function escapeHtml(unsafe: any) {
	if (!unsafe) return ''

	return `${unsafe}`
		.replace(/&quot;/g, '"')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;')
}
function parametersToCasparXML(params: { [key: string]: string }): string {
	let xml = ''
	for (const [key, value] of Object.entries(params)) {
		xml += `<componentData id="${key}"><data id="text" value="${escapeHtml(value)}" /></componentData>`
	}

	return `<templateData>${xml}</templateData>`
}
