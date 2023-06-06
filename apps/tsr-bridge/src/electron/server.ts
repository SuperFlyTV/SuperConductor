import { BridgeAPI, LoggerLike, BridgeId } from '@shared/api'
import { WebsocketConnection, WebsocketServer } from '@shared/server-lib'
import { BaseBridge } from '@shared/tsr-bridge'
import { AppSettings } from '../models/AppData'
import { StorageHandler } from './storageHandler'

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const { version: CURRENT_VERSION }: { version: string } = require('../../package.json')

export class TSRBridgeServer {
	private _server: WebsocketServer | undefined = undefined
	settings: AppSettings

	private baseBridge: BaseBridge
	private connectedSuperConductor:
		| {
				send: (msg: BridgeAPI.FromBridge.Any) => void
		  }
		| undefined = undefined
	private connectToSuperConductorTimeout: NodeJS.Timeout | null = null
	private connectionToSuperConductor: {
		host: string
		bridgeId: BridgeId
		connection: WebsocketConnection
		connected: boolean
		lastTry: number
	} | null = null

	constructor(private logger: LoggerLike, private storage: StorageHandler) {
		this.settings = this.storage.getAppData().settings

		storage.on('appData', (appData) => {
			const oldSettings = this.settings
			this.settings = appData.settings

			if (
				oldSettings.listenPort !== appData.settings.listenPort ||
				oldSettings.acceptConnections !== appData.settings.acceptConnections
			) {
				this.init()
			}
			this.triggerConnectToSuperConductor(true)
		})

		this.baseBridge = new BaseBridge((msg) => {
			if (!this.connectedSuperConductor) return
			this.connectedSuperConductor.send(msg)
		}, this.logger)
	}

	init(): void {
		if (this._server) {
			this.logger.info(`Re-initializing...`)
			this._server.close()
			this._server = undefined
		} else {
			this.logger.info(`Initializing...`)
		}
		if (this.settings.acceptConnections) {
			this.logger.info(`Starting up websocket server on port ${this.settings.listenPort}`)
			this._server = new WebsocketServer(
				this.logger,
				this.settings.listenPort,
				(connection: WebsocketConnection) => {
					// On connection

					this.onConnectionToSuperConductor(connection)
				}
			)
		}
		this.triggerConnectToSuperConductor(true)

		this.logger.info(`Initialized!`)
	}
	private triggerConnectToSuperConductor(asap: boolean) {
		if (asap && this.connectToSuperConductorTimeout) {
			clearTimeout(this.connectToSuperConductorTimeout)
			this.connectToSuperConductorTimeout = null
		}

		if (!this.connectToSuperConductorTimeout) {
			this.connectToSuperConductorTimeout = setTimeout(
				() => {
					this.connectToSuperConductorTimeout = null
					try {
						this.connectToSuperConductor()
					} catch (err) {
						this.logger.error(err)
					}
					this.triggerConnectToSuperConductor(false)
				},
				asap ? 10 : 5000
			)
		}
	}
	private onConnectionToSuperConductor(connection: WebsocketConnection, ourBridgeId?: BridgeId) {
		if (this.connectedSuperConductor) {
			this.logger.warn('Already connected to a SuperConductor, switching to new...')
		}
		this.connectedSuperConductor = {
			send: (message: BridgeAPI.FromBridge.Any) => {
				// this.logger.debug('sent message ' + JSON.stringify(message))
				connection.send(message)
			},
		}

		connection.on('disconnected', () => {
			this.logger.info('TSR-Bridge: disconnected!')

			this.connectedSuperConductor = undefined

			Promise.resolve()
				.then(async () => {
					await this.baseBridge.peripheralsHandler?.setConnectedToParent(false)
				})
				.catch(this.logger.error)
		})
		connection.on('message', (message: BridgeAPI.FromSuperConductor.Any) => {
			this.baseBridge.handleMessage(message)
		})

		// Send a request to SuperConductor to get our id:
		// send({
		// 	type: 'initRequestId',
		// })
		this.logger.info('TSR-Bridge: Connected!')
		if (ourBridgeId) {
			this.connectedSuperConductor.send({
				type: 'init',
				id: ourBridgeId,
				version: CURRENT_VERSION,
				incoming: true,
			})
			this.baseBridge.onReceivedBridgeId(ourBridgeId).catch(this.logger.error)
		} else {
			this.connectedSuperConductor.send({ type: 'initRequestId' })
		}
	}

	private connectToSuperConductor() {
		const shouldConnect = !this.settings.acceptConnections
		const host: string = this.settings.superConductorHost
		const bridgeId: BridgeId = this.settings.bridgeId

		if (this.connectionToSuperConductor) {
			// Should we close the current connection?
			if (
				!shouldConnect ||
				host !== this.connectionToSuperConductor.host ||
				bridgeId !== this.connectionToSuperConductor.bridgeId ||
				(!this.connectionToSuperConductor.connected &&
					Date.now() - this.connectionToSuperConductor.lastTry > 10 * 1000)
			) {
				this.logger.info(`Closing connection to SuperConductor at ${this.connectionToSuperConductor.host}`)
				this.connectionToSuperConductor.connection.terminate()
				this.connectionToSuperConductor = null
			}
		}

		if (!this.connectionToSuperConductor) {
			// Should we open a connection?
			if (shouldConnect && host && bridgeId) {
				this.logger.info(`Connecting to SuperConductor at ${host}...`)
				const connection = new WebsocketConnection(this.logger, host)
				connection.once('connected', () => {
					this.logger.info(`Connected to SuperConductor at ${host}`)
					if (this.connectionToSuperConductor) {
						this.connectionToSuperConductor.connected = true
					}

					this.onConnectionToSuperConductor(connection, bridgeId)
				})
				connection.on('disconnected', () => {
					this.logger.info(`Connection to SuperConductor at ${host} was closed`)
					this.connectionToSuperConductor = null
				})
				connection.on('error', (error) => {
					this.logger.error(`Error at connection to SuperConductor at ${host}`)
					this.logger.error(error)
				})
				this.connectionToSuperConductor = {
					host,
					bridgeId,
					connection,
					connected: false,
					lastTry: Date.now(),
				}
			}
		}
	}
	async terminate(): Promise<void> {
		await this.baseBridge.destroy()
	}
}
