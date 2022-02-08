import { Rundown } from '../models/rundown/Rundown'
import { ActiveTrigger, ActiveTriggers, Trigger } from '../models/rundown/Trigger'
import { IPCServer } from './IPCServer'
import { StorageHandler } from './storageHandler'

export class TriggersHandler {
	private prevTriggersMap: { [fullItentifier: string]: ActiveTrigger } = {}

	constructor(private storage: StorageHandler, private ipcServer: IPCServer) {}

	updateTriggers(activeTriggers: ActiveTriggers) {
		const rundowns: Rundown[] = this.storage.getAllRundowns()

		// Collect all triggers from the rundowns:
		const actions: {
			trigger: Trigger
			rundownId: string
			groupId: string
			partId: string
		}[] = []

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

		const activeTriggersMap: { [fullItentifier: string]: ActiveTrigger } = {}

		const newlyActiveTriggers: { [fullItentifier: string]: true } = {}

		// Go through the currently active (key-pressed) keys, in order to figure out which keys are newly active:
		for (const activeTrigger of activeTriggers) {
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
