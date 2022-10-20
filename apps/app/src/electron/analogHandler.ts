import { LoggerLike } from '@shared/api'
import _ from 'lodash'
import { ActiveTriggers } from '../models/rundown/Trigger'
import { BridgeHandler } from './bridgeHandler'
import { IPCServer } from './IPCServer'
import { StorageHandler } from './storageHandler'
import { SessionHandler } from './sessionHandler'
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

	constructor(
		private log: LoggerLike,
		private storage: StorageHandler,
		private ipcServer: IPCServer,
		private bridgeHandler: BridgeHandler,
		private session: SessionHandler
	) {
		super()
	}

	/** Called when a peripheral updates its activeAnalog value */
	updateActiveAnalog(fullIdentifier: string, activeAnalog: ActiveAnalog | null) {
		if (activeAnalog) {
			this.activeAnalogs[fullIdentifier] = activeAnalog
			this.handleUpdate(fullIdentifier, activeAnalog)
		} else {
			delete this.activeAnalogs[fullIdentifier]
		}
	}
	/** Called from the storage when an AnalogInput has been updated */
	updateAnalogInput(fullIdentifier: string, analogInput: AnalogInput | null) {
		// TODO: trigger datastore send
	}

	private handleUpdate(fullIdentifier: string, activeAnalog: ActiveAnalog) {
		const project = this.storage.getProject()

		for (const analogInputSetting of Object.values(project.analogInputSettings)) {
			if (analogInputSetting.fullIdentifier === fullIdentifier) {
				const analogInput = this.calculateAnalogInput(
					this.storage.getAnalogInput(fullIdentifier),
					analogInputSetting,
					activeAnalog
				)

				this.storage.updateAnalogInput(fullIdentifier, analogInput)
			}
		}
	}
	private calculateAnalogInput(
		analogInput: AnalogInput | undefined,
		setting: AnalogInputSetting,
		activeAnalog: ActiveAnalog
	): AnalogInput {
		if (!analogInput) {
			analogInput = {
				activeAnalog,
				modified: 0,
				value: 0,
			}
		}

		analogInput.activeAnalog = activeAnalog

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
		analogInput.modified = Date.now()
		return analogInput
	}
}
