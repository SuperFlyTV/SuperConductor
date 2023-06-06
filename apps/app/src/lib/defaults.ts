import { Project } from '../models/project/Project'
import { Rundown } from '../models/rundown/Rundown'
import { AutoFillMode, AutoFillSortMode, Group, PlayoutMode } from '../models/rundown/Group'
import { INTERNAL_BRIDGE_ID } from '../models/project/Bridge'
import { DeviceType, MappingCasparCG, TimelineContentTypeCasparCg } from 'timeline-state-resolver-types'
import { literal } from '@shared/lib'
import { shortID } from './util'
import { Part } from '../models/rundown/Part'
import { RepeatingType } from './timeLib'
import { AppData } from '../models/App/AppData'

export function getDefaultAppData(currentVersion: string): AppData {
	return {
		windowPosition: {
			// Default window position:
			y: undefined,
			x: undefined,
			width: 1200,
			height: 600,
			maximized: false,
		},
		version: {
			seenVersion: null,
			currentVersion: currentVersion,
			currentVersionIsPrerelease: false, // placeholder, it'll be set in storageHandler soon anyway.
		},
		project: {
			id: 'default',
		},
		rundowns: {},
		triggers: {
			// These defaults are inspired by the default keyboard shortcuts in CasparCG:
			// Stop: F1
			// Play: F2
			// Load: F3
			// Pause/Resume: F4
			// Next: F5
			// Update: F6
			// Invoke: F7
			// Preview: F8
			// Clear: F10
			// Clear Video layer: F11
			// Clear Channel: F12
			// Play Now: Shift+F2
			stop: [
				{
					label: 'F1',
					fullIdentifiers: ['keyboard-F1'],
					action: 'stop',
				},
			],
			play: [
				{
					label: 'F2',
					fullIdentifiers: ['keyboard-F2'],
					action: 'play',
				},
			],
			pause: [
				{
					label: 'F3',
					fullIdentifiers: ['keyboard-F3'],
					action: 'pause',
				},
			],
			previous: [
				{
					label: 'F5',
					fullIdentifiers: ['keyboard-F5'],
					action: 'previous',
				},
			],
			next: [
				{
					label: 'F6',
					fullIdentifiers: ['keyboard-F6'],
					action: 'next',
				},
			],
		},
	}
}
export function getDefaultProject(newName = 'Default Project'): Omit<Project, 'id'> {
	return {
		name: newName,

		mappings: {
			'casparcg-1-10': literal<MappingCasparCG>({
				device: DeviceType.CASPARCG,
				deviceId: 'casparcg0',
				layerName: 'CasparCG 1-10',
				channel: 1,
				layer: 10,
			}),
			'casparcg-1-20': literal<MappingCasparCG>({
				device: DeviceType.CASPARCG,
				deviceId: 'casparcg0',
				layerName: 'CasparCG 1-20',
				channel: 1,
				layer: 20,
			}),
			'casparcg-1-30': literal<MappingCasparCG>({
				device: DeviceType.CASPARCG,
				deviceId: 'casparcg0',
				layerName: 'CasparCG 1-30',
				channel: 1,
				layer: 30,
			}),
			'casparcg-2-10': literal<MappingCasparCG>({
				device: DeviceType.CASPARCG,
				deviceId: 'casparcg0',
				layerName: 'CasparCG 2-10',
				channel: 2,
				layer: 10,
			}),
			'casparcg-2-20': literal<MappingCasparCG>({
				device: DeviceType.CASPARCG,
				deviceId: 'casparcg0',
				layerName: 'CasparCG 2-20',
				channel: 2,
				layer: 20,
			}),
			'casparcg-2-30': literal<MappingCasparCG>({
				device: DeviceType.CASPARCG,
				deviceId: 'casparcg0',
				layerName: 'CasparCG 2-30',
				channel: 2,
				layer: 30,
			}),
		},

		bridges: {
			[INTERNAL_BRIDGE_ID]: {
				id: INTERNAL_BRIDGE_ID,
				name: 'Internal bridge',
				outgoing: false,
				url: '',
				settings: {
					devices: {
						casparcg0: {
							type: DeviceType.CASPARCG,
							options: { host: '127.0.0.1', port: 5250 },
						},
					},
					peripherals: {},
					autoConnectToAllPeripherals: true,
				},
				clientSidePeripheralSettings: {},
			},
		},

		deviceNames: {
			casparcg0: 'CasparCG',
		},

		settings: {
			enableInternalBridge: true,
		},

		analogInputSettings: {},
	}
}
export function getDefaultRundown(newName = 'Default Rundown'): Omit<Rundown, 'id'> {
	return {
		name: newName,

		groups: [
			{
				...getDefaultGroup(),
				id: shortID(),
				name: 'Main',

				parts: [
					{
						id: shortID(),
						name: 'Part 1',
						timeline: [
							{
								obj: {
									id: shortID(),
									enable: {
										start: 0,
										duration: 5000,
									},
									layer: 'casparcg-1-10',
									content: {
										type: TimelineContentTypeCasparCg.MEDIA,
										file: 'AMB',
										deviceType: DeviceType.CASPARCG,
									},
								},
								resolved: {
									instances: [
										{
											start: 0,
											end: 5000,
										},
									],
								},
							},
						],
						triggers: [],
						resolved: {
							duration: 5000,
							label: 'Main',
						},
					},
				],
			},
		],
	}
}
export function getDefaultGroup(): Omit<Group, 'id' | 'name'> {
	return {
		transparent: false,

		// One-at-a-time should be true by default, because this is the "easiest" way to play things for a user.
		// The multi-play-mode requires the user to knowingly set different layers for the various content
		// so it is a bit more complicated to use.
		oneAtATime: true,
		autoPlay: false,
		loop: false,
		playoutMode: PlayoutMode.NORMAL,
		parts: [],
		playout: {
			playingParts: {},
		},
		preparedPlayData: null,
		autoFill: {
			enable: false,
			filter: '',
			layerIds: [],
			mode: AutoFillMode.APPEND,
			sortMode: AutoFillSortMode.ADDED_ASC,
		},
		schedule: {
			startTime: undefined,
			repeating: {
				type: RepeatingType.NO_REPEAT,
			},
		},
	}
}
export function getDefaultPart(): Omit<Part, 'id' | 'name'> {
	return {
		timeline: [],
		resolved: {
			duration: 0,
			label: '',
		},
		triggers: [],
	}
}
