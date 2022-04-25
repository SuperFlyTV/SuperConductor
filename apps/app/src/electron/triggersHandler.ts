import { KeyDisplay, KeyDisplayTimeline } from '@shared/api'
import { assertNever } from '@shared/lib'
import _ from 'lodash'
import { getGroupPlayData } from '../lib/playhead'
import { ActiveTrigger, ActiveTriggers } from '../models/rundown/Trigger'
import { BridgeHandler } from './bridgeHandler'
import { IPCServer } from './IPCServer'
import { StorageHandler } from './storageHandler'
import { Action, getAllActionsInRundowns } from '../lib/triggers/action'
import { DefiningArea, getKeyDisplayForButtonActions, prepareTriggersAreaMap } from '../lib/triggers/keyDisplay'

export class TriggersHandler {
	private prevTriggersMap: { [fullItentifier: string]: ActiveTrigger } = {}

	/** Contains a collection of the currently active (pressed) keys on the keyboard */
	private activeKeys: ActiveTriggers = []
	/** Contains a collection of ALL triggers/keys/buttons on all Panels */
	private allTriggers: {
		[fullIdentifier: string]: ActiveTrigger
	} = {}
	/** Contains a collection of the currently active (pressed) triggers/keys/buttons on all Panels */
	private activeTriggers: ActiveTriggers = []

	private updatePeripheralsTimeout: NodeJS.Timeout | null = null

	private sentkeyDisplays: { [fullidentifier: string]: KeyDisplay | KeyDisplayTimeline } = {}
	private definingArea: DefiningArea | null = null

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
	updateDefiningArea(definingArea: DefiningArea | null): void {
		this.definingArea = definingArea
	}
	private updatePeripherals(): void {
		const actions = this.getActions()
		const project = this.storage.getProject()

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

		const triggersAreaMap = prepareTriggersAreaMap(project)

		for (const [fullIdentifier, trigger] of Object.entries(this.allTriggers)) {
			const used = usedTriggers[fullIdentifier]

			const keyDisplay: KeyDisplay | KeyDisplayTimeline = getKeyDisplayForButtonActions(
				trigger,
				triggersAreaMap,
				this.definingArea,
				used?.actions
			)

			if (!_.isEqual(this.sentkeyDisplays[fullIdentifier], keyDisplay)) {
				this.sentkeyDisplays[fullIdentifier] = keyDisplay
				setKeyDisplay(this.bridgeHandler, trigger, keyDisplay)
			}
		}
	}
	/** Returns all Actions in all Rundowns */
	private getActions(): Action[] {
		return getAllActionsInRundowns(this.storage.getAllRundowns(), this.storage.getProject())
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
		let intercepted = false
		let updatePeripherals = false

		if (this.definingArea) {
			// We're currently defining a new area.

			// Intercept keys on that peripheral device:
			for (const fullIdentifier of Object.keys(newlyActiveTriggers)) {
				const activeTrigger = allActiveTriggers.find((t) => t.fullIdentifier === fullIdentifier)
				if (!activeTrigger) continue

				if (
					this.definingArea.bridgeId === activeTrigger.bridgeId &&
					this.definingArea.deviceId === activeTrigger.deviceId
				) {
					intercepted = true
					this.addTriggerToArea(this.definingArea, activeTrigger)
					updatePeripherals = true
				}
			}
		}

		if (!intercepted) {
			// Go through the actions
			for (const action of actions) {
				// This a little bit unintuitive, but our first step here is to filter out actions
				// that correspone only to _newly active_ triggers.

				let allMatching = false
				/** If the action has a newly pressed */
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

						// const isPlaying = action.group.oneAtATime ? playData.groupIsPlaying : myPlayhead
						let isPlaying: boolean
						if (!myPlayhead) {
							// The part is not playing
							isPlaying = false
						} else if (myPlayhead.partPauseTime !== undefined) {
							// The part is paused, so we need to resume it:
							isPlaying = false
						} else {
							isPlaying = true
						}

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
		}

		// Store the new state for next time:
		this.prevTriggersMap = activeTriggersMap

		if (updatePeripherals) {
			this.updatePeripherals()
		}
	}
	private addTriggerToArea(definingArea: DefiningArea, activeTrigger: ActiveTrigger) {
		const project = this.storage.getProject()

		const bridge = project.bridges[definingArea.bridgeId]
		if (!bridge) return
		// Check if the trigger is already in another

		let found = false
		for (const [peripheralId, peripheralSettings] of Object.entries(bridge.peripheralSettings)) {
			if (found) break

			if (peripheralId === definingArea.deviceId) {
				for (const area of Object.values(peripheralSettings.areas)) {
					if (found) break
					if (area.identifiers.includes(activeTrigger.identifier)) {
						found = true
					}
				}
			}
		}

		if (!found) {
			// Add the trigger to the area:
			const peripheralSettings = bridge.peripheralSettings[definingArea.deviceId]
			if (!peripheralSettings) return
			const area = peripheralSettings.areas[definingArea.areaId]
			if (!area) return
			area.identifiers.push(activeTrigger.identifier)
			this.storage.updateProject(project)
		}
	}
}

function setKeyDisplay(
	bridgeHandler: BridgeHandler,
	trigger: ActiveTrigger,
	keyDisplay: KeyDisplay | KeyDisplayTimeline
) {
	const bridgeConnection = bridgeHandler.getBridgeConnection(trigger.bridgeId)
	if (bridgeConnection) {
		bridgeConnection.peripheralSetKeyDisplay(trigger.deviceId, trigger.identifier, keyDisplay)
	}
}
