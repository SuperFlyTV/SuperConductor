import { literal } from '@shared/lib'
import { ResourceAny } from '@shared/models'
import {
	DeviceOptionsAtem,
	DeviceOptionsCasparCG,
	DeviceType,
	MappingAtem,
	MappingAtemType,
	MappingCasparCG,
	TSRTimelineObj,
	TimelineContentCCGMedia,
	TimelineContentTypeCasparCg,
} from 'timeline-state-resolver-types'
import { shortID } from '../lib/util'
import { Bridge } from '../models/project/Bridge'
import { Project } from '../models/project/Project'
import { Group } from '../models/rundown/Group'
import { Part } from '../models/rundown/Part'
import { Rundown } from '../models/rundown/Rundown'
import { TimelineObj } from '../models/rundown/TimelineObj'
import { getDefaultGroup, getDefaultPart } from '../lib/defaults'
import { postProcessPart } from './rundown'
import { StorageHandler } from './storageHandler'

export function makeDevData(): {
	project: Project
	rundowns: Rundown[]
	resources: ResourceAny[]
} {
	const casparDeviceId = shortID()

	const fileProject = StorageHandler.getDefaultProject('DevProject')
	const project: Project = {
		...fileProject.project,
		id: fileProject.id,
	}

	// Bridge:
	{
		const bridgeId = shortID()
		const bridge = (project.bridges[bridgeId] = literal<Bridge>({
			id: bridgeId,
			name: `Bridge ${bridgeId}`,
			outgoing: false,
			url: '',
			settings: {
				devices: {},
				peripherals: {},
				autoConnectToAllPeripherals: true,
			},

			clientSidePeripheralSettings: {},
		}))

		// Devices:
		{
			{
				const device = (bridge.settings.devices[casparDeviceId] = literal<DeviceOptionsCasparCG>({
					type: DeviceType.CASPARCG,
					options: {
						host: '127.0.0.1',
					},
				}))

				// Mappings
				{
					for (const m of rangeIds(1, 50)) {
						project.mappings[m.id] = literal<MappingCasparCG>({
							device: device.type,
							deviceId: casparDeviceId,
							layerName: `CasparCG 1-${m.i}`,
							channel: 1,
							layer: m.i,
						})
					}
				}
			}
			{
				const deviceId = shortID()
				const device = (bridge.settings.devices[deviceId] = literal<DeviceOptionsAtem>({
					type: DeviceType.ATEM,
					options: {
						host: '127.0.0.1',
					},
				}))

				// Mappings
				{
					for (const m of rangeIds(1, 10)) {
						project.mappings[m.id] = literal<MappingAtem>({
							device: device.type,
							deviceId: deviceId,
							layerName: `ME 1-${m.i}`,
							mappingType: MappingAtemType.MixEffect,
							index: m.i,
						})
					}
				}
			}
		}
	}
	// project.peripheralSettings
	// TODO

	const notRandom = getNotRandomFcn()
	// Rundowns:
	const rundowns: Rundown[] = []
	for (const r of rangeIds(1, 1)) {
		const fileRundown = StorageHandler.getDefaultRundown(`Rundown ${r.i}`)
		const rundown: Rundown = {
			...fileRundown.rundown,
			id: fileRundown.id,
			groups: [],
		}
		rundowns.push(rundown)

		// Groups
		for (const g of rangeIds(1, 10)) {
			const group = literal<Group>({
				...getDefaultGroup(),
				id: g.id,
				name: `Group ${g.i}`,
			})
			rundown.groups.push(group)

			// Groups
			for (const p of rangeIds(1, Math.floor(notRandom(10)))) {
				const part: Part = {
					...getDefaultPart(),
					id: p.id,
					name: `Part ${p.i}`,
				}
				group.parts.push(part)

				// Timeline
				{
					const layerId = pickRandom(
						Object.entries(project.mappings).filter((e) => e[1].deviceId === casparDeviceId),
						notRandom
					)[0]

					const obj: TimelineObj = {
						resourceId: '',
						obj: literal<TSRTimelineObj<TimelineContentCCGMedia>>({
							id: shortID(),
							enable: {
								start: 0,
								end: 60000,
							},
							layer: layerId,
							content: {
								deviceType: DeviceType.CASPARCG,
								type: TimelineContentTypeCasparCg.MEDIA,
								file: 'folder/file',
							},
						}),
						resolved: {
							instances: [], // set later, in postProcessPart
						},
					}
					part.timeline.push(obj)
				}

				postProcessPart(part)
			}
		}
	}

	const resources: ResourceAny[] = []

	// for (const r of rangeIds(1, 1000)) {
	// 	resources.push(
	// 		literal<CasparCGMedia>({
	// 			deviceId: casparDeviceId,
	// 			id: r.id,
	// 			displayName: `Media/file${r.i}`,

	// 			resourceType: ResourceType.CASPARCG_MEDIA,

	// 			type: 'video',
	// 			name: `Media/file${r.i}`,
	// 			size: 123456,
	// 			changed: Date.now(),
	// 			frames: 1234,
	// 			frameTime: '1/50',
	// 			frameRate: 50,
	// 			duration: 60000,
	// 		})
	// 	)
	// }

	return {
		project,
		rundowns,
		resources,
	}
}

function rangeIds(start: number, end: number) {
	const arr: {
		i: number
		id: string
	}[] = []
	for (let i = start; i <= end; i++) {
		arr.push({
			i: i,
			id: shortID(),
		})
	}
	return arr
}
function getNotRandomFcn(seed = 0) {
	return (max: number) => {
		seed += 1.618033988749

		return seed % max
	}
}
function pickRandom<T>(arr: T[], random: (max: number) => number): T {
	return arr[Math.floor(random(arr.length))]
}
