import { ActiveTrigger, ActiveTriggers, Trigger } from '../models/rundown/Trigger'
import { IPCServer } from './IPCServer'
import { StorageHandler } from './storageHandler'

export class TriggersHandler {
	private prevTriggersMap: { [fullItentifier: string]: ActiveTrigger } = {}

	private activeKeys: ActiveTriggers = []
	private activeTriggers: ActiveTriggers = []

	constructor(private storage: StorageHandler, private ipcServer: IPCServer) {}

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
							groupId: group.id,
							partId: part.id,
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
				if (action.trigger.action === 'play') {
					this.ipcServer
						.playPart({
							rundownId: action.rundownId,
							groupId: action.groupId,
							partId: action.partId,
						})
						.catch(console.error)
				} else if (action.trigger.action === 'stop') {
					this.ipcServer
						.stopPart({
							rundownId: action.rundownId,
							groupId: action.groupId,
							partId: action.partId,
						})
						.catch(console.error)
				}
			}
		}

		// Store the new state for next time:
		this.prevTriggersMap = activeTriggersMap
	}
}
export interface Action {
	trigger: Trigger
	rundownId: string
	groupId: string
	partId: string
}
