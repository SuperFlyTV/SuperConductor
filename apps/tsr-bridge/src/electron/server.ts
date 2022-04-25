import { Logger } from 'winston'
import { BridgeAPI } from '@shared/api'
import { WebsocketConnection, WebsocketServer } from '@shared/server-lib'
import { BaseBridge } from '@shared/tsr-bridge'

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const { version: CURRENT_VERSION }: { version: string } = require('../../package.json')
const SERVER_PORT = 5401
const baseBridges = new Set<BaseBridge>()

export const init = (log: Logger): void => {
	log.info('TSR-Bridge current version:', CURRENT_VERSION)

	const _server = new WebsocketServer(log, SERVER_PORT, (connection: WebsocketConnection) => {
		// On connection
		log.info('TSR-Bridge: New connection!')
		const baseBridge = new BaseBridge(send, log)
		baseBridges.add(baseBridge)

		connection.on('disconnected', () => {
			log.info('TSR-Bridge: disconnected!')

			Promise.resolve()
				.then(async () => {
					if (baseBridge.peripheralsHandler) {
						await baseBridge.peripheralsHandler.setConnectedToParent(false)
					}
					await baseBridge.destroy()
					baseBridges.delete(baseBridge)
				})
				.catch(log.error)
		})
		connection.on('message', (msg: BridgeAPI.FromTPT.Any) => {
			baseBridge.handleMessage(msg)
		})

		function send(message: BridgeAPI.FromBridge.Any) {
			connection.send(message)
		}

		// Send a request to TPT to get our id:
		send({
			type: 'initRequestId',
		})
	})
}

export const close = async () => {
	for (const baseBridge of Array.from(baseBridges)) {
		await baseBridge.destroy()
		baseBridges.delete(baseBridge)
	}
}
