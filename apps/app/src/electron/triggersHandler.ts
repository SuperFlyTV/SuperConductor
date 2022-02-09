import { KeyDisplayTimeline, AttentionLevel } from '@shared/api'
import { getGroupPlayData } from '../lib/playhead'
import { findGroup } from '../lib/util'
import { Group } from '../models/rundown/Group'
import { Part } from '../models/rundown/Part'
import { ActiveTrigger, ActiveTriggers, Trigger } from '../models/rundown/Trigger'
import { BridgeHandler } from './bridgeHandler'
import { IPCServer } from './IPCServer'
import { StorageHandler } from './storageHandler'

export class TriggersHandler {
	private prevTriggersMap: { [fullItentifier: string]: ActiveTrigger } = {}

	private activeKeys: ActiveTriggers = []
	private activeTriggers: ActiveTriggers = []

	constructor(private storage: StorageHandler, private ipcServer: IPCServer, private bridgeHandler: BridgeHandler) {}

	setKeyboardKeys(activeKeys: ActiveTriggers) {
		this.activeKeys = activeKeys
		this.handleUpdate()
	}
	updateTriggers(activeTriggers: ActiveTriggers) {
		this.activeTriggers = activeTriggers
		this.handleUpdate()
	}
	private handleUpdate() {
		const allTriggers: ActiveTriggers = [...this.activeKeys, ...this.activeTriggers]
		const rundowns = this.storage.getAllRundowns()

		// Collect all actions from the rundowns:
		const actions: Action[] = []
		for (const rundown of rundowns) {
			for (const group of rundown.groups) {
				for (const part of group.parts) {
					for (const trigger of part.triggers) {
						actions.push({
							trigger,
							rundownId: rundown.id,
							group,
							part,
						})
					}
				}
			}
		}

		// Go through the currently active (key-pressed) keys, in order to figure out which keys are newly active:
		const activeTriggersMap: { [fullItentifier: string]: ActiveTrigger } = {}
		const newlyActiveTriggers: { [fullItentifier: string]: true } = {}
		for (const activeTrigger of allTriggers) {
			activeTriggersMap[activeTrigger.fullIdentifier] = activeTrigger
			// Check if the key (trigger) was newly pressed (active):
			if (!this.prevTriggersMap[activeTrigger.fullIdentifier]) {
				// This key was newly pressed.

				newlyActiveTriggers[activeTrigger.fullIdentifier] = true
			}
		}

		// Go through the actions
		for (const action of actions) {
			// This a little bit unintuitive, but our first step here is to filter out actions
			// that correspone only to _newly active_ triggers.

			let allMatching = false
			let matchingNewlyPressed = false
			const matchingTriggers: ActiveTriggers = []
			for (const fullIdentifier of action.trigger.fullIdentifiers) {
				if (newlyActiveTriggers[fullIdentifier]) {
					matchingNewlyPressed = true
				}

				// All of the fullIdentifiers much be active (ie all of the speficied keys must be pressed down):
				if (activeTriggersMap[fullIdentifier]) {
					allMatching = true
					matchingTriggers.push(activeTriggersMap[fullIdentifier])
				} else {
					// The trigger is not pressed, so we can stop looking
					allMatching = false
					break
				}
			}

			if (matchingNewlyPressed && allMatching) {
				// We've found a match!

				// Execute the action:
				if (action.trigger.action === 'play') {
					this.ipcServer
						.playPart({
							rundownId: action.rundownId,
							groupId: action.group.id,
							partId: action.part.id,
						})
						.then(() => {
							setKeyDisplay(
								this.bridgeHandler,
								matchingTriggers,
								generatePlayKeyDisplay(this.storage, action)
							)
						})
						.catch((e) => {
							setKeyDisplay(
								this.bridgeHandler,
								matchingTriggers,
								generateErrorKeyDisplay(this.storage, action, e)
							)
						})
				} else if (action.trigger.action === 'stop') {
					this.ipcServer
						.stopPart({
							rundownId: action.rundownId,
							groupId: action.group.id,
							partId: action.part.id,
						})
						.catch(console.error)
				}
			}
		}

		// Store the new state for next time:
		this.prevTriggersMap = activeTriggersMap
	}
}
interface Action {
	trigger: Trigger
	rundownId: string
	group: Group
	part: Part
}
function setKeyDisplay(bridgeHandler: BridgeHandler, triggers: ActiveTriggers, keyDisplay: KeyDisplayTimeline) {
	for (const trigger of triggers) {
		const bridgeConnection = bridgeHandler.getBridgeConnection(trigger.bridgeId)
		if (bridgeConnection) {
			bridgeConnection.peripheralSetKeyDisplay(trigger.deviceId, trigger.identifier, keyDisplay)
		}
	}
}

function generatePlayKeyDisplay(storage: StorageHandler, action: Action): KeyDisplayTimeline {
	const rundown = storage.getRundown(action.rundownId)

	const keyTimeline: KeyDisplayTimeline = [
		{
			id: 'idle',
			priority: -1,
			enable: { while: 1 },
			content: {
				attentionLevel: AttentionLevel.NEUTRAL,

				header: {
					long: `Play ${action.part.name}`,
					short: `▶ ${action.part.name.slice(-7)}`,
				},
				info: {
					long: `#duration(${action.part.resolved.duration})`,
				},
			},
		},
	]

	if (rundown) {
		const group = findGroup(rundown, action.group.id)

		const playData = getGroupPlayData(group?.preparedPlayData ?? null)

		const myPlayhead = playData.playheads[action.group.id]

		if (myPlayhead) {
			keyTimeline.push({
				id: 'active',
				enable: {
					start: myPlayhead.partStartTime,
					end: myPlayhead.partEndTime,
				},
				content: {
					attentionLevel: AttentionLevel.NEUTRAL,

					header: {
						long: `Play ${action.part.name}`,
						short: `▶ ${action.part.name.slice(-7)}`,
					},
					info: {
						long: `#countdown(${myPlayhead.partEndTime})`,
					},
				},
			})
		}
	}

	return keyTimeline
}
function generateErrorKeyDisplay(storage: StorageHandler, action: Action, e: any): KeyDisplayTimeline {
	const keyTimeline: KeyDisplayTimeline = [
		...generatePlayKeyDisplay(storage, action),
		{
			id: 'error',
			priority: 999,
			enable: {
				start: Date.now(),
				duration: 5 * 1000, // 5 seconds
			},
			content: {
				attentionLevel: AttentionLevel.INFO,

				header: {
					long: `Error`,
					short: `Error`,
				},
				info: {
					long: `${e}`,
				},
			},
		},
	]
	return keyTimeline
}
