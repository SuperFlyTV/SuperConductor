import { Mappings, TSRTimeline } from 'timeline-state-resolver-types'
import { Octokit } from '@octokit/rest'
import semver from 'semver'
import { ResourceAny } from '@shared/models'
import { WebsocketConnection, WebsocketServer, BridgeAPI } from '@shared/api'
import { assertNever } from '@shared/lib'
import { PeripheralsHandler } from '@shared/peripherals'
import { TSR } from './TSR'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version: CURRENT_VERSION }: { version: string } = require('../package.json')
const SERVER_PORT = 5401

console.log('TSR-Bridge current version:', CURRENT_VERSION)

const octokit = new Octokit()
octokit.rest.repos
	.listReleases({
		owner: 'SuperFlyTV',
		repo: 'SuperConductor',
		per_page: 1,
		page: 1,
	})
	.then((response) => {
		const latestVersion = response.data[0].tag_name
		if (semver.lt(CURRENT_VERSION, response.data[0].tag_name)) {
			console.warn(
				'TSR-Bridge is out of date! Current version: v%s, latest version: %s',
				CURRENT_VERSION,
				latestVersion
			)
			console.warn('Visit https://github.com/SuperFlyTV/SuperConductor/releases to download the latest version.')
		}
	})
	.catch(console.error)

const _server = new WebsocketServer(SERVER_PORT, (connection: WebsocketConnection) => {
	// On connection

	tsr.newConnection = true

	connection.on('connected', () => {
		console.log('Connected!')
	})
	connection.on('disconnected', () => {
		console.log('Disconnected!')
	})
	connection.on('message', (msg: BridgeAPI.FromTPT.Any) => {
		if (msg.type === 'setId') {
			bridgeId = msg.id
			// Reply to TPT with our id
			send({ type: 'init', id: bridgeId, version: CURRENT_VERSION })

			peripheralsHandler = initialize(bridgeId, sendAndCatch)
		} else if (msg.type === 'addTimeline') {
			playTimeline(msg.timelineId, msg.timeline, msg.currentTime)
		} else if (msg.type === 'removeTimeline') {
			stopTimeline(msg.timelineId, msg.currentTime)
		} else if (msg.type === 'getTimelineIds') {
			send({ type: 'timelineIds', timelineIds: Object.keys(storedTimelines) })
		} else if (msg.type === 'setMappings') {
			updateMappings(msg.mappings, msg.currentTime)
		} else if (msg.type === 'setSettings') {
			tsr.updateDevices(msg.devices, send).catch(console.error)
		} else if (msg.type === 'refreshResources') {
			tsr.refreshResources((deviceId: string, resources: ResourceAny[]) => {
				send({
					type: 'updatedResources',
					deviceId,
					resources,
				})
			})
		} else if (msg.type === 'peripheralSetKeyDisplay') {
			if (!peripheralsHandler) throw new Error('PeripheralsHandler not initialized')

			peripheralsHandler.setKeyDisplay(msg.deviceId, msg.keyDisplay)
		} else {
			assertNever(msg)
		}
	})

	function send(message: BridgeAPI.FromBridge.Any) {
		connection.send(message)
	}
	function sendAndCatch(message: BridgeAPI.FromBridge.Any) {
		try {
			connection.send(message)
		} catch (e) {
			console.error(e)
		}
	}

	let bridgeId: string | null = null
	let peripheralsHandler: PeripheralsHandler | null = null

	// Send a request to TPT to get our id:
	send({
		type: 'initRequestId',
	})
})

const tsr = new TSR()

let mapping: Mappings | undefined = undefined

const storedTimelines: {
	[id: string]: TSRTimeline
} = {}

function updateTSR(currentTime: number) {
	tsr.setCurrentTime(currentTime)

	const fullTimeline: TSRTimeline = []

	for (const timeline of Object.values(storedTimelines)) {
		for (const obj of timeline) {
			fullTimeline.push(obj)
		}
	}
	// console.log('fullTimeline', JSON.stringify(fullTimeline, undefined, 2))
	// console.log('mapping', JSON.stringify(mapping, undefined, 2))

	tsr.conductor.setTimelineAndMappings(fullTimeline, mapping)
}

function playTimeline(id: string, newTimeline: TSRTimeline, currentTime: number) {
	storedTimelines[id] = newTimeline

	updateTSR(currentTime)
	return Date.now()
}
function updateMappings(newMapping: Mappings, currentTime: number) {
	mapping = newMapping
	updateTSR(currentTime)
}

function stopTimeline(id: string, currentTime: number) {
	delete storedTimelines[id]
	updateTSR(currentTime)
}

function initialize(bridgeId: string, send: (message: BridgeAPI.FromBridge.Any) => void): PeripheralsHandler {
	const peripheralsHandler = new PeripheralsHandler(bridgeId)

	peripheralsHandler.on('connected', (deviceId, deviceName) => {
		send({ type: 'PeripheralStatus', deviceId, deviceName, status: 'connected' })
	})
	peripheralsHandler.on('disconnected', (deviceId, deviceName) =>
		send({ type: 'PeripheralStatus', deviceId, deviceName, status: 'disconnected' })
	)
	peripheralsHandler.on('keyDown', (deviceId, identifier) =>
		send({ type: 'PeripheralTrigger', trigger: 'keyDown', deviceId, identifier })
	)
	peripheralsHandler.on('keyUp', (deviceId, identifier) =>
		send({ type: 'PeripheralTrigger', trigger: 'keyUp', deviceId, identifier })
	)

	peripheralsHandler.init()

	// Initial status

	return peripheralsHandler
}
