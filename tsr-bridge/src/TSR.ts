import {
	Conductor,
	ConductorOptions,
	DeviceType,
	MappingCasparCG,
	Mappings,
	TSRTimeline,
} from 'timeline-state-resolver'
import { literal } from 'timeline-state-resolver/dist/devices/device'

export type Optional<T> = {
	[K in keyof T]?: T[K]
}

export type TSRInput = Optional<Input>

export interface Input {
	settings: TSRSettings
	devices: {
		[deviceId: string]: any
	}
	mappings: Mappings
	timeline: TSRTimeline
}

export interface TSRSettings {
	initializeAsClear?: boolean
	multiThreading?: boolean
	multiThreadedResolver?: boolean
}

export class TSR {
	allInputs: TSRInput = {
		devices: {
			caspar0: {
				type: DeviceType.CASPARCG,
				options: {
					host: '127.0.0.1',
					port: 5250,
				},
			},
		},
		mappings: {
			casparLayer0: literal<MappingCasparCG>({
				device: DeviceType.CASPARCG,
				deviceId: 'caspar0',
				channel: 1,
				layer: 10,
			}),
			casparLayer1: literal<MappingCasparCG>({
				device: DeviceType.CASPARCG,
				deviceId: 'caspar0',
				channel: 1,
				layer: 11,
			}),
			casparLayer2: literal<MappingCasparCG>({
				device: DeviceType.CASPARCG,
				deviceId: 'caspar0',
				channel: 1,
				layer: 12,
			}),
		},
		settings: {
			multiThreading: true,
			multiThreadedResolver: false,
		},
		timeline: undefined,
	}

	conductor: Conductor

	constructor() {
		const c: ConductorOptions = {
			getCurrentTime: Date.now,
			initializeAsClear: true,
			multiThreadedResolver: false,
			proActiveResolve: true,
		}
		this.conductor = new Conductor(c)

		this.conductor.on('error', (e, ...args) => {
			console.error('TSR', e, ...args)
		})
		this.conductor.on('info', (msg, ...args) => {
			console.log('TSR', msg, ...args)
		})
		this.conductor.on('warning', (msg, ...args) => {
			console.log('Warning: TSR', msg, ...args)
		})

		this.conductor.addDevice('caspar0', this.allInputs.devices!.caspar0).catch(console.error)

		this.conductor.setTimelineAndMappings([], this.allInputs.mappings)
		this.conductor.init().catch(console.error)
	}
}
