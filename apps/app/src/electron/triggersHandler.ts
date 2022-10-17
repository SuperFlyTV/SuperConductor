import { KeyDisplay, KeyDisplayTimeline, LoggerLike } from '@shared/api'
import { assertNever, literal } from '@shared/lib'
import _ from 'lodash'
import { getGroupPlayData } from '../lib/playhead'
import { ActiveTrigger, ActiveTriggers } from '../models/rundown/Trigger'
import { BridgeHandler } from './bridgeHandler'
import { IPCServer } from './IPCServer'
import { StorageHandler } from './storageHandler'
import {
	ActionAny,
	getAllApplicationActions,
	getPartsWithRefInRundowns,
	getAllActionsInParts,
	ApplicationAction,
} from '../lib/triggers/action'
import {
	DefiningArea,
	getKeyDisplayForButtonActions,
	prepareTriggersAreaMap,
} from '../lib/triggers/keyDisplay/keyDisplay'
import { SessionHandler } from './sessionHandler'
import { PeripheralStatus } from '../models/project/Peripheral'

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

	constructor(
		private log: LoggerLike,
		private storage: StorageHandler,
		private ipcServer: IPCServer,
		private bridgeHandler: BridgeHandler,
		private session: SessionHandler
	) {}

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
	onPeripheralStatus(peripheralId: string, peripheral: PeripheralStatus | null) {
		if (!peripheral?.status.connected) {
			// The peripheral has been disconnected

			// Delete the sent keyDisplays for that device,
			// so that updates will be sent later if it reconnects:
			for (const fullIdentifier of Object.keys(this.sentkeyDisplays)) {
				if (fullIdentifier.startsWith(peripheralId)) {
					delete this.sentkeyDisplays[fullIdentifier]
				}
			}
		} else {
			// The device is connected
			this.triggerUpdatePeripherals()
		}
	}
	private updatePeripherals(): void {
		const actions = this.getActions()
		const project = this.storage.getProject()

		const usedTriggers: {
			[fullIdentifier: string]: {
				actions: ActionAny[]
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

			const peripheralStatus = this.session.getPeripheralStatus(trigger.bridgeId, trigger.deviceId)

			if (peripheralStatus?.status.connected) {
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
	}
	/** Returns all Actions in all Rundowns */
	private getActions(): ActionAny[] {
		const allRundowns = this.storage.getAllRundowns()
		const allParts = getPartsWithRefInRundowns(allRundowns)
		const project = this.storage.getProject()
		const appData = this.storage.getAppData()

		const rundownActions = getAllActionsInParts(allParts, project, undefined)
		const appActions = getAllApplicationActions(this.session.getSelection(), allParts, appData)

		return [
			...rundownActions.map((action) =>
				literal<ActionAny>({
					type: 'rundown',
					...action,
				})
			),
			...appActions.map((action) =>
				literal<ActionAny>({
					type: 'application',
					...action,
				})
			),
		]
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
				for (const fullIdentifier of action.trigger.fullIdentifiers) {
					if (newlyActiveTriggers[fullIdentifier]) {
						matchingNewlyPressed = true
					}

					// All of the fullIdentifiers much be active (ie all of the speficied keys must be pressed down):
					if (activeTriggersMap[fullIdentifier]) {
						allMatching = true
					} else {
						// The trigger is not pressed, so we can stop looking
						allMatching = false
						break
					}
				}

				if (matchingNewlyPressed && allMatching) {
					// We've found a match!

					// Execute the action:
					if (action.type === 'rundown') {
						if (action.trigger.action === 'play') {
							this.ipcServer
								.playPart({
									rundownId: action.rundownId,
									groupId: action.group.id,
									partId: action.part.id,
								})
								.catch(this.log.error)
						} else if (action.trigger.action === 'stop') {
							this.ipcServer
								.stopPart({
									rundownId: action.rundownId,
									groupId: action.group.id,
									partId: action.part.id,
								})
								.catch(this.log.error)
						} else if (action.trigger.action === 'playStop') {
							const playData = getGroupPlayData(action.group.preparedPlayData ?? null)
							const myPlayhead = playData.playheads[action.part.id]

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
									.catch(this.log.error)
							} else {
								this.ipcServer
									.playPart({
										rundownId: action.rundownId,
										groupId: action.group.id,
										partId: action.part.id,
									})
									.catch(this.log.error)
							}
						} else {
							assertNever(action.trigger.action)
						}
					} else if (action.type === 'application') {
						if (action.trigger.action === 'play') {
							this._appActionPlay(action)
						} else if (action.trigger.action === 'stop') {
							this._appActionStop(action)
						} else if (action.trigger.action === 'playStop') {
							this._appActionPlayStop(action)
						} else if (action.trigger.action === 'pause') {
							this._appActionPause(action)
						} else if (action.trigger.action === 'delete') {
							this._appActionDelete(action)
						} else if (action.trigger.action === 'next') {
							this._appActionNext(action)
						} else if (action.trigger.action === 'previous') {
							this._appActionPrevious(action)
						} else {
							assertNever(action.trigger.action)
						}
					} else {
						assertNever(action)
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
		for (const [peripheralId, peripheralSettings] of Object.entries(bridge.clientSidePeripheralSettings)) {
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
			const peripheralSettings = bridge.clientSidePeripheralSettings[definingArea.deviceId]
			if (!peripheralSettings) return
			const area = peripheralSettings.areas[definingArea.areaId]
			if (!area) return
			area.identifiers.push(activeTrigger.identifier)
			this.storage.updateProject(project)
		}
	}
	private _appActionPlay(action: ApplicationAction) {
		for (const selected of action.selected) {
			if (selected.type === 'group') {
				this.ipcServer
					.playGroup({
						rundownId: selected.rundownId,
						groupId: selected.group.id,
					})
					.catch(this.log.error)
			} else if (selected.type === 'part') {
				this.ipcServer
					.playPart({
						rundownId: selected.rundownId,
						groupId: selected.group.id,
						partId: selected.part.id,
					})
					.catch(this.log.error)
			} else assertNever(selected)
		}
	}
	private _appActionStop(action: ApplicationAction) {
		for (const selected of action.selected) {
			if (selected.type === 'group') {
				this.ipcServer
					.stopGroup({
						rundownId: selected.rundownId,
						groupId: selected.group.id,
					})
					.catch(this.log.error)
			} else if (selected.type === 'part') {
				this.ipcServer
					.stopPart({
						rundownId: selected.rundownId,
						groupId: selected.group.id,
						partId: selected.part.id,
					})
					.catch(this.log.error)
			} else assertNever(selected)
		}
	}
	private _appActionPlayStop(action: ApplicationAction) {
		// First, check if any is playing:
		let isAnyPlaying = false
		const groupIds = new Set<string>()
		for (const selected of action.selected) {
			if (!groupIds.has(selected.group.id)) {
				groupIds.add(selected.group.id)

				const playData = getGroupPlayData(selected.group.preparedPlayData ?? null)

				if (selected.type === 'group') {
					if (playData.anyPartIsPlaying && !playData.allPartsArePaused) {
						isAnyPlaying = true
					}
				} else if (selected.type === 'part') {
					const myPlayhead = playData.playheads[selected.part.id]
					if (myPlayhead && !myPlayhead.partPauseTime) {
						isAnyPlaying = true
					}
				} else assertNever(selected)
			}
		}

		if (isAnyPlaying) {
			this._appActionStop(action)
		} else {
			this._appActionPlay(action)
		}
	}
	private _appActionPause(action: ApplicationAction) {
		for (const selected of action.selected) {
			if (selected.type === 'group') {
				this.ipcServer
					.pauseGroup({
						rundownId: selected.rundownId,
						groupId: selected.group.id,
					})
					.catch(this.log.error)
			} else if (selected.type === 'part') {
				this.ipcServer
					.pausePart({
						rundownId: selected.rundownId,
						groupId: selected.group.id,
						partId: selected.part.id,
					})
					.catch(this.log.error)
			} else assertNever(selected)
		}
	}
	private _appActionDelete(action: ApplicationAction) {
		for (const selected of action.selected) {
			if (selected.type === 'group') {
				this.ipcServer
					.deleteGroup({
						rundownId: selected.rundownId,
						groupId: selected.group.id,
					})
					.catch(this.log.error)
			} else if (selected.type === 'part') {
				this.ipcServer
					.deletePart({
						rundownId: selected.rundownId,
						groupId: selected.group.id,
						partId: selected.part.id,
					})
					.catch(this.log.error)
			} else assertNever(selected)
		}
	}
	private _appActionNext(action: ApplicationAction) {
		for (const selected of action.selected) {
			if (selected.type === 'group') {
				this.ipcServer
					.playNext({
						rundownId: selected.rundownId,
						groupId: selected.group.id,
					})
					.catch(this.log.error)
			} else if (selected.type === 'part') {
				this.ipcServer
					.playNext({
						rundownId: selected.rundownId,
						groupId: selected.group.id,
					})
					.catch(this.log.error)
			} else assertNever(selected)
		}
	}
	private _appActionPrevious(action: ApplicationAction) {
		for (const selected of action.selected) {
			if (selected.type === 'group') {
				this.ipcServer
					.playPrev({
						rundownId: selected.rundownId,
						groupId: selected.group.id,
					})
					.catch(this.log.error)
			} else if (selected.type === 'part') {
				this.ipcServer
					.playPrev({
						rundownId: selected.rundownId,
						groupId: selected.group.id,
					})
					.catch(this.log.error)
			} else assertNever(selected)
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
