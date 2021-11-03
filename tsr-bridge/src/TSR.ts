import { Conductor, ConductorOptions, DeviceType } from 'timeline-state-resolver'

export class TSR {
	casparCGDevice: any = {
		type: DeviceType.CASPARCG,
		options: {
			host: '127.0.0.1',
			port: 5250,
		},
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

		this.conductor.addDevice('caspar0', this.casparCGDevice).catch(console.error)

		this.conductor.setTimelineAndMappings([], undefined)
		this.conductor.init().catch(console.error)
	}
}
