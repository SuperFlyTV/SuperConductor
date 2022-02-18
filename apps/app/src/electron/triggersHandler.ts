import { KeyDisplay, KeyDisplayTimeline } from '@shared/api'
import { assertNever } from '@shared/lib'
import _ from 'lodash'
import { getGroupPlayData } from '../lib/playhead'
import { ActiveTrigger, ActiveTriggers } from '../models/rundown/Trigger'
import { BridgeHandler } from './bridgeHandler'
import { IPCServer } from './IPCServer'
import { StorageHandler } from './storageHandler'
import { Action } from './triggers/action'
import { idleKeyDisplay, playKeyDisplay, playStopKeyDisplay, stopKeyDisplay } from './triggers/keyDisplay'

export class TriggersHandler {
	private prevTriggersMap: { [fullItentifier: string]: ActiveTrigger } = {}

	private activeKeys: ActiveTriggers = []
	private allTriggers: {
		[fullIdentifier: string]: ActiveTrigger
	} = {}
	private activeTriggers: ActiveTriggers = []

	private updatePeripheralsTimeout: NodeJS.Timeout | null = null

	private sentkeyDisplays: { [fullidentifier: string]: KeyDisplay | KeyDisplayTimeline } = {}

	constructor(private storage: StorageHandler, private ipcServer: IPCServer, private bridgeHandler: BridgeHandler) {}

	setKeyboardKeys(activeKeys: ActiveTriggers) {
		this.activeKeys = activeKeys
		this.handleUpdate()
	}
	updateActiveTriggers(activeTriggers: ActiveTriggers) {
		this.activeTriggers = activeTriggers
		this.handleUpdate()
	}
	registerTrigger(fullIdentifier: string, trigger: ActiveTrigger | null): void {
		if (trigger) {
			this.allTriggers[fullIdentifier] = trigger
		} else {
			delete this.allTriggers[fullIdentifier]
		}

		delete this.sentkeyDisplays[fullIdentifier] // So that an update will be sent

		this.triggerUpdatePeripherals()
	}

	triggerUpdatePeripherals(): void {
		if (this.updatePeripheralsTimeout) {
			clearTimeout(this.updatePeripheralsTimeout)
		}

		this.updatePeripheralsTimeout = setTimeout(() => {
			this.updatePeripheralsTimeout = null
			this.updatePeripherals()
		}, 20)
	}
	private updatePeripherals(): void {
		const actions = this.getActions()

		const usedTriggers: {
			[fullIdentifier: string]: {
				actions: Action[]
			}
		} = {}

		for (const action of actions) {
			for (const fullIdentifier of action.trigger.fullIdentifiers) {
				if (this.allTriggers[fullIdentifier]) {
					if (!usedTriggers[fullIdentifier]) {
						usedTriggers[fullIdentifier] = {
							actions: [action],
						}
					} else {
						usedTriggers[fullIdentifier].actions.push(action)
					}
				}
			}
		}

		for (const [fullIdentifier, trigger] of Object.entries(this.allTriggers)) {
			let keyDisplay: KeyDisplay | KeyDisplayTimeline
			const used = usedTriggers[fullIdentifier]
			if (used) {
				const firstAction = used.actions[0]

				if (firstAction.trigger.action === 'play') {
					keyDisplay = playKeyDisplay(used.actions)
				} else if (firstAction.trigger.action === 'stop') {
					keyDisplay = stopKeyDisplay(used.actions)
				} else if (firstAction.trigger.action === 'playStop') {
					keyDisplay = playStopKeyDisplay(used.actions)
				} else {
					keyDisplay = []
					assertNever(firstAction.trigger.action)
				}
			} else {
				// is not used anywhere
				keyDisplay = idleKeyDisplay(this.storage)
			}

			if (!_.isEqual(this.sentkeyDisplays[fullIdentifier], keyDisplay)) {
				this.sentkeyDisplays[fullIdentifier] = keyDisplay
				setKeyDisplay(this.bridgeHandler, trigger, keyDisplay)
			}
		}
	}
	private getActions(): Action[] {
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
		return actions
	}

	private handleUpdate() {
		const actions = this.getActions()

		// Go through the currently active (key-pressed) keys, in order to figure out which keys are newly active:
		const activeTriggersMap: { [fullItentifier: string]: ActiveTrigger } = {}
		const newlyActiveTriggers: { [fullItentifier: string]: true } = {}
		const allActiveTriggers: ActiveTriggers = [...this.activeKeys, ...this.activeTriggers]
		for (const activeTrigger of allActiveTriggers) {
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
						.catch(console.error)
				} else if (action.trigger.action === 'stop') {
					this.ipcServer
						.stopPart({
							rundownId: action.rundownId,
							groupId: action.group.id,
							partId: action.part.id,
						})
						.catch(console.error)
				} else if (action.trigger.action === 'playStop') {
					const playData = getGroupPlayData(action.group.preparedPlayData ?? null)
					const myPlayhead = playData.playheads[action.part.id]

					const isPlaying = action.group.oneAtATime ? playData.groupIsPlaying : myPlayhead

					if (isPlaying) {
						this.ipcServer
							.stopPart({
								rundownId: action.rundownId,
								groupId: action.group.id,
								partId: action.part.id,
							})
							.catch(console.error)
					} else {
						this.ipcServer
							.playPart({
								rundownId: action.rundownId,
								groupId: action.group.id,
								partId: action.part.id,
							})
							.catch(console.error)
					}
				} else {
					assertNever(action.trigger.action)
				}
			}
		}

		// Store the new state for next time:
		this.prevTriggersMap = activeTriggersMap
	}
}

function setKeyDisplay(bridgeHandler: BridgeHandler, trigger: ActiveTrigger, keyDisplay: KeyDisplayTimeline) {
	const bridgeConnection = bridgeHandler.getBridgeConnection(trigger.bridgeId)
	if (bridgeConnection) {
		bridgeConnection.peripheralSetKeyDisplay(trigger.deviceId, trigger.identifier, keyDisplay)
	}
}
