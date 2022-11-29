import React from 'react'
import { ActiveTriggers } from '../../models/rundown/Trigger'
import { EventEmitter } from 'events'
/** Used to communicate with the backend */

export interface IHotkeyContext {
	triggers: TriggersEmitter
}
export class TriggersEmitter extends EventEmitter {
	private peripheralTriggers: ActiveTriggers = []
	private activeKeys: ActiveTriggers = []

	setPeripheralTriggers(peripheralTriggers: ActiveTriggers): void {
		this.peripheralTriggers = peripheralTriggers
		this.emit('peripheralTriggers', this.peripheralTriggers)
		this.handleUpdates()
	}
	setActiveKeys(activeKeys: ActiveTriggers): void {
		this.activeKeys = activeKeys
		this.emit('activeKeys', this.activeKeys)
		this.handleUpdates()
	}
	getAllTriggers(): ActiveTriggers {
		// All triggers combined, both from peripherals and keyboard:
		return [...this.activeKeys, ...this.peripheralTriggers]
	}
	handleUpdates(): void {
		// Emit them, so that the GUI can listen to them and tie them to triggers:
		this.emit('trigger', this.getAllTriggers())
	}
	isAnyoneListening(): boolean {
		return this.listenerCount('trigger') > 0
	}
}
export const HotkeyContext = React.createContext<IHotkeyContext>({
	triggers: new TriggersEmitter(),
})
