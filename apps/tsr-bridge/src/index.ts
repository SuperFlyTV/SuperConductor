import { Mappings, TSRTimeline } from 'timeline-state-resolver-types'
import { ResourceAny } from '@shared/models'
import { WebsocketConnection, WebsocketServer, BridgeAPI } from '@shared/api'
import { assertNever } from '@shared/lib'
import { TSR } from './TSR'

const CURRENT_VERSION = 0
const SERVER_PORT = 5401

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
		} else if (msg.type === 'addTimeline') {
			playTimeline(msg.timelineId, msg.timeline)
		} else if (msg.type === 'removeTimeline') {
			stopTimeline(msg.timelineId)
		} else if (msg.type === 'getTimelineIds') {
			send({ type: 'timelineIds', timelineIds: Object.keys(storedTimelines) })
		} else if (msg.type === 'setMappings') {
			updateMappings(msg.mappings)
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
		} else {
			assertNever(msg)
		}
	})

	function send(message: BridgeAPI.FromBridge.Any) {
		connection.send(message)
	}

	let bridgeId: string | null = null

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

function updateTSR() {
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

function playTimeline(id: string, newTimeline: TSRTimeline) {
	storedTimelines[id] = newTimeline

	updateTSR()
	return Date.now()
}
function updateMappings(newMapping: Mappings) {
	mapping = newMapping
	updateTSR()
}

function stopTimeline(id: string) {
	delete storedTimelines[id]
	updateTSR()
}
