import React from 'react'
import sorensen, { Sorensen } from '@sofie-automation/sorensen'
import { ActiveTriggers } from '../../models/rundown/Trigger'
import { EventEmitter } from 'events'
/** Used to communicate with the backend */

export interface IHotkeyContext {
	triggers: TriggersEmitter
	sorensen: Sorensen
}
export class TriggersEmitter extends EventEmitter {
	private peripheralTriggers: ActiveTriggers = []
	private activeKeys: ActiveTriggers = []

	setPeripheralTriggers(peripheralTriggers: ActiveTriggers) {
		this.peripheralTriggers = peripheralTriggers
		this.emit('peripheralTriggers', this.peripheralTriggers)
		this.handleUpdates()
	}
	setActiveKeys(activeKeys: ActiveTriggers) {
		this.activeKeys = activeKeys
		this.emit('activeKeys', this.activeKeys)
		this.handleUpdates()
	}
	getAllTriggers() {
		// All triggers combined, both from peripherals and keyboard:
		return [...this.activeKeys, ...this.peripheralTriggers]
	}
	handleUpdates() {
		// Emit them, so that the GUI can listen to them and tie them to triggers:
		this.emit('trigger', this.getAllTriggers())
	}
	isAnyoneListening() {
		return this.listenerCount('trigger') > 0
	}
}
export const HotkeyContext = React.createContext<IHotkeyContext>({
	sorensen,
	triggers: new TriggersEmitter(),
})
