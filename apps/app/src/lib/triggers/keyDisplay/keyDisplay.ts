import { KeyDisplay, KeyDisplayTimeline, AttentionLevel } from '@shared/api'
import { assertNever, HSVtoRGB, RGBToString } from '@shared/lib'
import { ActionAny } from '../action'
import { PeripheralArea } from '../../../models/project/Peripheral'
import { AnalogInputSetting, Project } from '../../../models/project/Project'
import { ActiveTrigger } from '../../../models/rundown/Trigger'
import { keyDisplayRundownPlay, keyDisplayRundownPlayStop, keyDisplayRundownStop } from './rundownAction'
import {
	keyDisplayApplicationDelete,
	keyDisplayApplicationNext,
	keyDisplayApplicationPause,
	keyDisplayApplicationPlay,
	keyDisplayApplicationPlayStop,
	keyDisplayApplicationPrevious,
	keyDisplayApplicationStop,
} from './applicationAction'
import { TriggerArea, TriggersAreaMap, triggersAreaToArea } from './lib'
import { ActiveAnalog } from '../../../models/rundown/Analog'
import { AnalogInput } from '../../../models/project/AnalogInput'

export function prepareTriggersAreaMap(project: Project): TriggersAreaMap {
	const triggersAreaMap = new Map<
		string,
		{
			areaId: string
			area: PeripheralArea
			keyRank: number
			areaColor: string
		}
	>()
	for (const [bridgeId, bridge] of Object.entries(project.bridges)) {
		for (const [deviceId, peripheralSettings] of Object.entries(bridge.clientSidePeripheralSettings)) {
			let iArea = -1
			for (const [areaId, area] of Object.entries(peripheralSettings.areas)) {
				iArea++

				const notRandom0 = iArea / 6
				const notRandom2 = Math.floor(iArea / 6) * 0.25
				const areaColor = RGBToString(
					HSVtoRGB({
						h: notRandom0 % 1, // 0..1
						s: 1,
						v: 0.25 + (notRandom2 % 1) * 0.5, // 0..0.75
					})
				)

				for (let i = 0; i < area.identifiers.length; i++) {
					const identifier = area.identifiers[i]

					const fullIdentifier = `${bridgeId}-${deviceId}-${identifier}`

					triggersAreaMap.set(fullIdentifier, {
						areaId,
						area,
						keyRank: i,
						areaColor,
					})
				}
			}
		}
	}
	return triggersAreaMap
}

/** Return a KeyDisplay for a button */
export function getKeyDisplayForButtonActions(
	trigger: ActiveTrigger,
	triggersAreaMap: TriggersAreaMap,
	definingArea: DefiningArea | null,
	actionsOnButton: ActionAny[] | undefined
): KeyDisplayTimeline | KeyDisplay {
	const triggerArea = triggersAreaMap.get(trigger.fullIdentifier)
	if (definingArea && definingArea.bridgeId === trigger.bridgeId && definingArea.deviceId === trigger.deviceId) {
		// An area is being defined on this peripheral.

		if (triggerArea) {
			// This key is in an area

			return {
				attentionLevel: AttentionLevel.NEUTRAL,
				intercept: 'areaDefine',

				area: triggersAreaToArea(triggerArea, definingArea.areaId === triggerArea.areaId),
			}
		} else {
			return {
				attentionLevel: AttentionLevel.NEUTRAL,
				intercept: 'areaDefine',
			}
		}
	} else {
		if (actionsOnButton && actionsOnButton.length) {
			// There is at least one action on this key

			const firstAction = actionsOnButton[0]

			if (firstAction.type === 'rundown') {
				if (firstAction.trigger.action === 'play') {
					return keyDisplayRundownPlay(firstAction, actionsOnButton, triggerArea)
				} else if (firstAction.trigger.action === 'stop') {
					return keyDisplayRundownStop(firstAction, actionsOnButton, triggerArea)
				} else if (firstAction.trigger.action === 'playStop') {
					return keyDisplayRundownPlayStop(firstAction, actionsOnButton, triggerArea)
				} else {
					assertNever(firstAction.trigger.action)
					return []
				}
			} else if (firstAction.type === 'application') {
				// TODO
				if (firstAction.trigger.action === 'play') {
					return keyDisplayApplicationPlay(firstAction, actionsOnButton, triggerArea)
				} else if (firstAction.trigger.action === 'stop') {
					return keyDisplayApplicationStop(firstAction, actionsOnButton, triggerArea)
				} else if (firstAction.trigger.action === 'playStop') {
					return keyDisplayApplicationPlayStop(firstAction, actionsOnButton, triggerArea)
				} else if (firstAction.trigger.action === 'pause') {
					return keyDisplayApplicationPause(firstAction, actionsOnButton, triggerArea)
				} else if (firstAction.trigger.action === 'delete') {
					return keyDisplayApplicationDelete(firstAction, actionsOnButton, triggerArea)
				} else if (firstAction.trigger.action === 'next') {
					return keyDisplayApplicationNext(firstAction, actionsOnButton, triggerArea)
				} else if (firstAction.trigger.action === 'previous') {
					return keyDisplayApplicationPrevious(firstAction, actionsOnButton, triggerArea)
				} else {
					assertNever(firstAction.trigger.action)
					return []
				}
			} else {
				assertNever(firstAction)
				return []
			}
		} else {
			// This key has no actions
			return idleKeyDisplay(triggerArea)
		}
	}
}

export function idleKeyDisplay(triggerArea: TriggerArea | undefined): KeyDisplayTimeline {
	return [
		{
			id: 'idle_not_assigned',
			layer: 'KEY',
			enable: { while: 1 },
			content: {
				attentionLevel: AttentionLevel.IGNORE,
				area: triggersAreaToArea(triggerArea, false),
			},
		},
	]
}

export function getKeyDisplayForAnalog(
	activeAnalog: ActiveAnalog,
	analogInput: AnalogInput | undefined,
	analogInputSetting: AnalogInputSetting | undefined
): KeyDisplayTimeline | KeyDisplay {
	if (!analogInput || !analogInputSetting) {
		return {
			attentionLevel: AttentionLevel.IGNORE,
			info: {
				long: 'Not assigned',
				analogValue: String(
					activeAnalog.value.rAbs ? activeAnalog.value.absolute : activeAnalog.value.relative
				),
			},
		}
	}

	return {
		attentionLevel: AttentionLevel.NEUTRAL,
		info: {
			long: analogInputSetting.label,
			analogValue: String(analogInput.value),
		},
	}
}

export interface DefiningArea {
	bridgeId: string
	deviceId: string
	areaId: string
}
