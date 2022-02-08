import { Rundown } from '../models/rundown/Rundown'
import { StorageHandler } from './storageHandler'

export class TriggersHandler {
	private currentTriggers: { [fullIdentifier: string]: true } = {}

	constructor(private storage: StorageHandler) {}

	updateTriggers(newTriggers: { [fullIdentifier: string]: true }) {
		// const newCount = Object.keys(newTriggers).length
		// const currentCount = Object.keys(this.currentTriggers).length
		// let somethingWasPressed = false

		const rundowns: Rundown[] = this.storage.getAllRundowns()

		for (const ident of Object.keys(newTriggers)) {
			if (!this.currentTriggers[ident]) {
				// This key was newly pressed

				// Look for a corresponding action:

				for (const rundown of rundowns) {
					for (const group of rundown.groups) {
						// const trigger = group.triggers[ident]
						//TODO
					}
				}
			}
		}

		this.currentTriggers = newTriggers
	}
}
