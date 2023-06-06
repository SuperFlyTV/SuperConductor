import { AttentionLevel, KeyDisplay, LoggerLike, PeripheralId, PeripheralInfo, PeripheralType } from '@shared/api'
import _ from 'lodash'
import * as MIDI from '@julusian/midi'
import { onKnownPeripheralCallback, Peripheral, WatchReturnType } from './peripheral'
import { protectString } from '@shared/models'

export type DevicesMap = Map<PeripheralId, { port: number; name: string }>

/** An interval (ms) for how fast the keys should flash, when flashing Fast */
const FLASH_FAST = 250
/** An interval (ms) for how fast the keys should flash, when flashing Slowly */
const FLASH_NORMAL = 1000

export class PeripheralMIDI extends Peripheral {
	private static Watching = false
	private connectedToParent = false
	static Watch(this: void, onKnownPeripheral: onKnownPeripheralCallback): WatchReturnType {
		if (PeripheralMIDI.Watching) {
			throw new Error('Already watching')
		}
		PeripheralMIDI.Watching = true

		let lastSeenDevices: DevicesMap = new Map<PeripheralId, { port: number; name: string }>()

		const Input = new MIDI.Input()

		// Checks for new or removed MIDI devices.
		const checkDevices = () => {
			// Get the count of how many MIDI devices are connected.
			const inputCount = Input.getPortCount()

			// Build the map of IDs
			const devices: DevicesMap = new Map<PeripheralId, { port: number; name: string }>()
			for (let i = 0; i < inputCount; i++) {
				const name = Input.getPortName(i)
				const id = protectString<PeripheralId>(`${i}: ${name}`)
				devices.set(id, { port: i, name })
			}

			// If the set of IDs hasn't changed, do nothing.
			if (_.isEqual(devices, lastSeenDevices)) {
				return
			}

			// Figure out which MIDI devices have been unplugged since the last check.
			const disconnectedDeviceIds = new Set(
				Array.from(lastSeenDevices.keys()).filter((id) => {
					return !devices.has(id)
				})
			)

			// Figure out which MIDI devices are being seen now that weren't seen in the last completed poll.
			for (const [id, { port, name }] of devices) {
				const alreadySeen = lastSeenDevices.has(id)

				if (alreadySeen) {
					continue
				}
				// Tell the watcher about the discovered MIDI panel.
				onKnownPeripheral(id, {
					name: name,
					type: PeripheralType.MIDI,
					devicePath: `${port}`,
				})
			}

			// Tell the watcher about disconnected MIDI devices.
			for (const id of disconnectedDeviceIds) {
				onKnownPeripheral(id, null)
			}

			// Update for the next iteration.
			lastSeenDevices = devices
		}

		// Check for new or removed MIDI devices every 5 seconds.
		const interval = setInterval(checkDevices, 5000)

		// Do an initial check in 100 milliseconds.
		setTimeout(checkDevices, 100)

		return {
			stop: () => {
				clearInterval(interval)
				PeripheralMIDI.Watching = false
			},
		}
	}
	private portIndex: number

	public initializing = false
	public connected = false

	private Input?: MIDI.Input
	private Output?: MIDI.Output

	private _info: PeripheralInfo | undefined
	private sentKeyDisplay: { [identifier: string]: KeyDisplay } = {}

	private seenKeys = new Map<
		string,
		{
			channel: number
			keyNumber: number
			state: boolean
		}
	>()
	private intervals = new Map<
		string,
		{
			hash: string
		}
	>()

	constructor(log: LoggerLike, id: PeripheralId, portIndexString: string) {
		super(log, id)
		this.portIndex = parseInt(portIndexString, 10)
	}

	async init(): Promise<void> {
		try {
			this.initializing = true

			const Input = new MIDI.Input()

			this._info = {
				name: Input.getPortName(this.portIndex),
				gui: {
					type: PeripheralType.MIDI,
				},
			}
			// MIDI devices connected:
			Input.on('message', (_, message: MIDI.MidiMessage) => {
				this.onMidiMessage(message)
			})
			// @ts-expect-error error event not in typings
			Input.on('error', (error) => this.log.error('Midi input error: ' + stringifyError(error)))

			Input.openPort(this.portIndex)
			this.Input = Input

			// Find corresponding output:
			const Output = new MIDI.Output()
			const outputPortCount = Output.getPortCount()
			for (let i = 0; i < outputPortCount; i++) {
				if (Output.getPortName(i) === this.info.name) {
					Output.openPort(i)
					this.Output = Output
				}
			}

			this.connected = true

			this.initializing = false
		} catch (e) {
			this.initializing = false
			throw e
		}
	}
	get info(): PeripheralInfo {
		if (!this._info) throw new Error('Peripheral not initialized')
		return this._info
	}
	async _setKeyDisplay(identifier: string, keyDisplay: KeyDisplay, force = false): Promise<void> {
		if (force || !_.isEqual(this.sentKeyDisplay[identifier], keyDisplay)) {
			this.sentKeyDisplay[identifier] = keyDisplay

			const key = this.seenKeys.get(identifier)
			if (key) {
				let keyValue = 0
				let flashInterval = 0

				if (this.connectedToParent) {
					if (keyDisplay.intercept) {
						// Normal functionality is intercepted / disabled

						if (keyDisplay.area) {
							if (keyDisplay.area.areaInDefinition) {
								keyValue = 127
								flashInterval = FLASH_FAST
							} else {
								keyValue = 127
							}
						} else {
							keyValue = 0
						}
					} else {
						if (keyDisplay.attentionLevel === AttentionLevel.NEUTRAL) {
							keyValue = 0
							flashInterval = 0
						} else if (keyDisplay.attentionLevel === AttentionLevel.INFO) {
							keyValue = 127
							flashInterval = 0
						} else if (keyDisplay.attentionLevel === AttentionLevel.NOTIFY) {
							keyValue = 127
							flashInterval = FLASH_NORMAL
						} else if (keyDisplay.attentionLevel === AttentionLevel.ALERT) {
							keyValue = 127
							flashInterval = FLASH_FAST
						}
					}
				}
				const interval = this.intervals.get(identifier)

				if (flashInterval) {
					const hash = `${flashInterval}_${keyValue}`

					if (!interval || interval.hash !== hash) {
						const setKeyValue = () => {
							const interval = this.intervals.get(identifier)
							if (interval?.hash !== hash) {
								// The interval hash changed (ie another setInterval has started) or has been removed
								clearInterval(intervalTimer)

								return
							}

							this.sendKeyValue(key.channel, key.keyNumber, keyValue)
							setTimeout(() => {
								const interval = this.intervals.get(identifier)
								if (interval?.hash !== hash) return
								this.sendKeyValue(key.channel, key.keyNumber, 0)
							}, flashInterval)
						}

						this.intervals.set(identifier, {
							hash,
						})
						const intervalTimer = setInterval(setKeyValue, flashInterval * 2)
						setKeyValue()
					}
				} else {
					if (interval) this.intervals.delete(identifier)
					this.sendKeyValue(key.channel, key.keyNumber, keyValue)
				}
			}
		}
	}
	async setConnectedToParent(connected: boolean): Promise<void> {
		this.connectedToParent = connected
		await this._updateAllKeys()
		if (connected) {
			setTimeout(() => {
				this.emitAllKeys()
			}, 1)
		}
	}
	async close(): Promise<void> {
		this.connected = false
		this.intervals.clear()
		this.Input?.closePort()
		this.Output?.closePort()

		await super._close()
	}
	private async _updateAllKeys(): Promise<void> {
		for (const [identifier, keyDisplay] of Object.entries(this.sentKeyDisplay)) {
			await this._setKeyDisplay(identifier, keyDisplay, true)
		}
	}
	private onMidiMessage(data: number[]) {
		// Ref:
		// https://www.cs.cf.ac.uk/Dave/Multimedia/node158.html

		if (data.length === 3) {
			const leadingBit = data[0] >> 7
			if (leadingBit === 1) {
				const fcn = (data[0] >> 4) & 7 // Use only the first nibble, and discard the leading bit

				if (fcn === 0) {
					// Note off
					const channel = data[0] & 15 // Second nibble
					const keyNumber = data[1]
					// const velocity = data[2]

					const identifier = `${channel}_${keyNumber}`

					this.seenKeys.set(identifier, {
						channel,
						keyNumber,
						state: false,
					})
					this.emit('keyUp', identifier)
				} else if (fcn === 1) {
					// Note on
					const channel = data[0] & 15 // Second nibble
					const keyNumber = data[1]
					// const velocity = data[2]

					const identifier = `${channel}_${keyNumber}`

					this.seenKeys.set(identifier, {
						channel,
						keyNumber,
						state: true,
					})
					this.emit('keyDown', identifier)
				} else if (fcn === 2) {
					// Polyphonic Key Pressure / Aftertouch
					// Not supported
				} else if (fcn === 3) {
					// Control change
					const channel = data[0] & 15 // Second nibble
					const controllerNumber = data[1]
					const value = data[2]
					const identifier = `${channel}_${controllerNumber}`

					this.emit('analog', identifier, {
						absolute: value,
						relative: this.getRelativeValue(identifier, value),
						rAbs: true,
					})
				} else if (fcn === 4) {
					// Program Change
					// Not supported
				} else if (fcn === 5) {
					// Channel Pressure / Aftertouch
					// Not supported
				} else if (fcn === 6) {
					// Pitch Bend
					// Not supported
				} else {
					// Not supported
				}
			}
		}
	}
	private emitAllKeys() {
		for (const [identifier, pressed] of this.seenKeys.entries()) {
			if (pressed) this.emit('keyDown', identifier)
			else this.emit('keyUp', identifier)
		}
	}
	private sendKeyValue(channel: number, keyNumber: number, keyValue: number) {
		let fcn = 0 // Note off
		if (keyValue) fcn = 1 // Note on

		const m: [number, number, number] = [(1 << 7) + (fcn << 4) + channel, keyNumber, keyValue]
		this.Output?.sendMessage(m)
	}
}
