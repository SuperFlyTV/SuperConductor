import { EventEmitter } from 'events'
import { KeyDisplay } from '@shared/api'

export interface PeripheralEvents {
	connected: () => void
	disconnected: () => void

	keyDown: (identifier: string) => void
	keyUp: (identifier: string) => void
}
export declare interface Peripheral {
	on<U extends keyof PeripheralEvents>(event: U, listener: PeripheralEvents[U]): this
	emit<U extends keyof PeripheralEvents>(event: U, ...args: Parameters<PeripheralEvents[U]>): boolean
}
export abstract class Peripheral extends EventEmitter {
	/** User-diaplayable name */
	protected _name = ''
	constructor(
		/** Locally unique id */
		public readonly id: string
	) {
		super()
	}

	public get name(): string {
		if (!this._name) throw new Error(`Peripheral "${this.id}" has no name`)
		return this._name
	}

	abstract setKeyDisplay(keyDisplay: KeyDisplay): void
	abstract close(): Promise<void>
}
