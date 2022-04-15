import WebSocket from 'ws'
import EventEmitter from 'events'
// eslint-disable-next-line node/no-extraneous-import
import winston from 'winston'

const PING_INTERVAL = 5000
const RECONNECT_INTERVAL = 5000
/*

Notes:

* Both the Bridge or the TPT can be the one initializing a connection.
* The "Client" is the one who initialized the connection (to the "Server")

* The client pings the bridge every 5 seconds to keep the connection alive and allow for monitoring status.
* The client tries to reconnect upon loss of connection

* Both the Server and Client monitors that pings and pongs have been received in order to determine connection status.
*/

export class WebsocketServer extends EventEmitter {
	private wss: WebSocket.Server

	private connections: WebsocketConnection[] = []

	constructor(
		private log: winston.Logger,
		port: number,
		private onConnection: (connection: WebsocketConnection) => void
	) {
		super()
		this.wss = new WebSocket.Server({ port })

		this.wss.on('close', () => {
			// The websocekt server is closed.
			this.connections.forEach((client) => {
				// this.clients = []
				client.terminate()
			})
			this.connections = []

			this.emit('close')
		})
		this.wss.on('error', (err: any) => {
			this.log.error('Error in WebSocket server')
			this.log.error(err)
		})

		this.wss.on('connection', (ws) => {
			// A new client has connected

			const bridge = new WebsocketConnection(this.log, ws)
			this.connections.push(bridge)

			this.onConnection(bridge)
		})
	}

	connectToServer(url: string): WebsocketConnection {
		const bridge = new WebsocketConnection(this.log, url)
		this.connections.push(bridge)
		setImmediate(() => {
			this.onConnection(bridge)
		})
		return bridge
	}
}

/**
 * Represents a connection to the other party.
 *
 */
export class WebsocketConnection extends EventEmitter {
	public connectionId: number = Date.now() + Math.random()
	private _connected = false

	private pingInterval: NodeJS.Timeout | null = null
	private lastPingReceived = 0

	private reconnectInterval: NodeJS.Timeout | null = null

	private ws: WebSocket | null = null
	private url: string | null

	constructor(
		private log: winston.Logger,
		/** On a server, this'll be a websocket connection. A client gets a url */
		connection: WebSocket | string
	) {
		super()
		if (typeof connection === 'string') {
			// Is client
			this.url = connection

			this._connect()
		} else {
			// Is server
			this.url = null
			this.ws = connection
			this.setupWs(this.ws)

			// If server, the ws connection is already open at this point
			this._onConnected()
		}
	}
	get connected(): boolean {
		return this._connected
	}

	terminate() {
		this.emit('disconnected')

		this.ws?.close()
		if (this.pingInterval) {
			clearInterval(this.pingInterval)
			this.pingInterval = null
		}
		if (this.reconnectInterval) {
			clearInterval(this.reconnectInterval)
			this.reconnectInterval = null
		}
		this.removeAllListeners()
	}
	send(message: any) {
		if (!this._connected) throw new Error('Not connected')
		if (!this.ws) throw new Error('No ws connection')

		this.ws.send(JSON.stringify(message))
	}

	private _onMessage(messageStr: string) {
		const msg = JSON.parse(messageStr)

		try {
			this.emit('message', msg)
		} catch (e) {
			this.log.error(e)
		}
	}

	private get isServer(): boolean {
		return this.url === null
	}
	private get isClient(): boolean {
		return !this.isServer
	}

	private setupWs(ws: WebSocket) {
		ws.on('close', () => {
			this._onDisconnected()
		})
		ws.on('error', (err) => {
			this.log.error('Error in WebSocket connection')
			this.log.error(err)
		})
		ws.on('ping', () => {
			this.lastPingReceived = Date.now()
		})
		ws.on('pong', () => {
			this.lastPingReceived = Date.now()
		})
		ws.on('message', (data) => {
			this._onMessage(data.toString())
		})
	}

	private _triggerReconnect() {
		if (this.reconnectInterval) {
			clearInterval(this.reconnectInterval)
		}

		this.reconnectInterval = setInterval(() => {
			if (this._connected) {
				if (this.reconnectInterval) clearInterval(this.reconnectInterval)
			} else {
				// Is not connected

				this._connect()
			}
		}, RECONNECT_INTERVAL)
	}
	private _connect() {
		// Shut down the current connection
		this.ws?.close()

		// Try to reconnect:
		if (this.isClient) {
			if (!this.url) throw new Error('url not set!')

			this.ws = new WebSocket(this.url)
			this.setupWs(this.ws)
			this._waitForConnection(this.ws)
		}
	}

	private _waitForConnection(ws: WebSocket) {
		ws.once('open', () => {
			this._onConnected()
		})
	}
	private _onConnected() {
		const wasConnected = this._connected
		this._connected = true
		this.lastPingReceived = Date.now()

		// Monitor and send pings:
		if (this.pingInterval) {
			clearInterval(this.pingInterval)
			this.pingInterval = null
		}
		this.pingInterval = setInterval(() => {
			// Monitor pings
			if (Date.now() - this.lastPingReceived > PING_INTERVAL * 2.5) {
				this._onDisconnected()
			} else {
				// The client sends pings:
				if (this.isClient) {
					this.ws?.ping()
				}
			}
		}, PING_INTERVAL)

		if (!wasConnected) {
			this.emit('connected')
		}
	}
	private _onDisconnected() {
		const wasConnected = this._connected
		this._connected = false

		if (this.pingInterval) {
			clearInterval(this.pingInterval)
			this.pingInterval = null
		}

		if (wasConnected) {
			this.emit('disconnected')
			if (this.isServer) {
				// On the server, a connection is lost forever
				this.emit('close')
				this.terminate()
			}
		}

		if (this.isClient) {
			this._triggerReconnect()
		}
	}
}
