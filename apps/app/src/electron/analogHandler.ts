import { StorageHandler } from './storageHandler'
import EventEmitter from 'events'
import { ActiveAnalog } from '../models/rundown/Analog'
import { AnalogInput } from '../models/project/AnalogInput'
import { AnalogInputSetting } from '../models/project/Project'

export interface AnalogHandlerEvents {
	failedGlobalTriggers: (identifiers: Readonly<Set<string>>) => void
}
export interface AnalogHandler {
	on<U extends keyof AnalogHandlerEvents>(event: U, listener: AnalogHandlerEvents[U]): this
	emit<U extends keyof AnalogHandlerEvents>(event: U, ...args: Parameters<AnalogHandlerEvents[U]>): boolean
}

export class AnalogHandler extends EventEmitter {
	/** Contains a collection of the currently active analog values on all Panels */
	private activeAnalogs: { [fullIdentifier: string]: ActiveAnalog } = {}

	constructor(private storage: StorageHandler) {
		super()
	}

	/** Called when a peripheral updates its activeAnalog value */
	updateActiveAnalog(fullIdentifier: string, activeAnalog: ActiveAnalog | null): void {
		if (activeAnalog) {
			this.activeAnalogs[fullIdentifier] = activeAnalog
			this.handleUpdate(fullIdentifier, activeAnalog)
		} else {
			delete this.activeAnalogs[fullIdentifier]
		}
	}

	private handleUpdate(fullIdentifier: string, activeAnalog: ActiveAnalog) {
		const project = this.storage.getProject()

		for (const [datastoreKey, analogInputSetting] of Object.entries(project.analogInputSettings)) {
			if (analogInputSetting.fullIdentifier === fullIdentifier) {
				const analogInput = this.calculateAnalogInput(
					this.storage.getAnalogInput(fullIdentifier),
					datastoreKey,
					analogInputSetting,
					activeAnalog
				)

				this.storage.updateAnalogInput(fullIdentifier, analogInput)
			}
		}
	}
	private calculateAnalogInput(
		analogInput: AnalogInput | undefined,
		datastoreKey: string,
		setting: AnalogInputSetting,
		activeAnalog: ActiveAnalog
	): AnalogInput {
		if (!analogInput) {
			analogInput = {
				datastoreKey: 'N/A',
				activeAnalog,
				modified: 0,
				value: 0,
			}
		}

		analogInput.activeAnalog = activeAnalog
		analogInput.datastoreKey = datastoreKey

		const scale = setting.scaleFactor ?? 1

		if (setting.updateUsingAbsolute) {
			const offset = setting.absoluteOffset ?? 0
			analogInput.value = offset + activeAnalog.value.absolute * scale
		} else {
			analogInput.value += activeAnalog.value.relative * scale

			if (setting.relativeMinCap !== undefined && analogInput.value <= setting.relativeMinCap)
				analogInput.value = setting.relativeMinCap
			if (setting.relativeMaxCap !== undefined && analogInput.value >= setting.relativeMaxCap)
				analogInput.value = setting.relativeMaxCap
		}
		// Round, to only keep the significant part (remove rogue decimals)
		if (analogInput.value < 100) {
			// For small numbers, we'll only round the mantissa-part of the number:
			const exp = this.separateExp(analogInput.value)
			analogInput.value = (Math.round(exp[0] * 1000) / 1000) * exp[1]
			analogInput.value = Math.round(analogInput.value * 100000) / 100000 // Remove rogue decimals that might have been introduced in
		} else {
			// For large numbers, we simply remove decimals:
			analogInput.value = Math.round(analogInput.value * 100) / 100
		}

		analogInput.modified = Date.now()
		return analogInput
	}
	/** Separate a number into its mantissa and exponent, return [m, n] where m*n is equal to the original value */
	private separateExp(value: number): [number, number] {
		const sign = Math.sign(value)
		let m = Math.abs(value)
		let exp = 1

		if (m !== 0) {
			while (!Number.isNaN(m)) {
				if (m >= 10) {
					m /= 10
					exp *= 10
				} else if (m <= 0.1) {
					m *= 10
					exp /= 10
				} else {
					break
				}
			}
		}

		return [m * sign, exp]
	}
}
