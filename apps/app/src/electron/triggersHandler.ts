import { deepClone } from '@shared/lib'
import { Rundown } from '../models/rundown/Rundown'
import { ActiveTriggers, Trigger } from '../models/rundown/Trigger'
import { IPCServer } from './IPCServer'
import { StorageHandler } from './storageHandler'

export class TriggersHandler {
	private currentTriggers: ActiveTriggers = {}

	constructor(private storage: StorageHandler, private ipcServer: IPCServer) {}

	updateTriggers(newTriggers: ActiveTriggers) {
		// const newCount = Object.keys(newTriggers).length
		// const currentCount = Object.keys(this.currentTriggers).length
		// let somethingWasPressed = false

		const rundowns: Rundown[] = this.storage.getAllRundowns()

		const triggers: {
			trigger: Trigger
			rundownId: string
			groupId: string
			partId: string
		}[] = []

		for (const rundown of rundowns) {
			for (const group of rundown.groups) {
				for (const part of group.parts) {
					for (const trigger of part.triggers) {
						triggers.push({
							trigger,
							rundownId: rundown.id,
							groupId: group.id,
							partId: part.id,
						})
					}
				}
			}
		}

		for (const ident of Object.keys(newTriggers)) {
			if (!this.currentTriggers[ident]) {
				// This key was newly pressed
				// Look for a corresponding action:

				for (const trigger of triggers) {
					let match = false
					for (const fullIdentifier of trigger.trigger.fullIdentifiers) {
						if (newTriggers[fullIdentifier]) {
							match = true
						} else {
							// The trigger is not pressed, so we can stop looking
							match = false
							break
						}
					}

					if (match) {
						// We've found a match!
						if (trigger.trigger.action === 'play') {
							this.ipcServer
								.playPart({
									rundownId: trigger.rundownId,
									groupId: trigger.groupId,
									partId: trigger.partId,
								})
								.catch(console.error)
						} else if (trigger.trigger.action === 'stop') {
							this.ipcServer
								.stopPart({
									rundownId: trigger.rundownId,
									groupId: trigger.groupId,
									partId: trigger.partId,
								})
								.catch(console.error)
						}
					}
				}
			}
		}
		// Store the new state for next time:
		this.currentTriggers = deepClone(newTriggers)
	}
}
