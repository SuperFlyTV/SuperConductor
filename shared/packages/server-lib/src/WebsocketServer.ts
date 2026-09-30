import WebSocket from 'ws'
import EventEmitter from 'events'
import { LoggerLike } from '@shared/api'

const PING_INTERVAL = 5000
const RECONNECT_INTERVAL = 5000
/*

Notes:

* Both the Bridge or the SuperConductor can be the one initializing a connection.
* The "Client" is the one who initialized the connection (to the "Server")

* The client pings the bridge every 5 seconds to keep the connection alive and allow for monitoring status.
* The client tries to reconnect upon loss of connection

* Both the Server and Client monitors that pings and pongs have been received in order to determine connection status.
*/

export class WebsocketServer extends EventEmitter {
	private wss: WebSocket.Server

	private connections: WebsocketConnection[] = []
	private isClosed = false

	constructor(
		private log: LoggerLike,
		port: number,
		private onConnection: (connection: WebsocketConnection) => void
	) {
		super()
		this.wss = new WebSocket.Server({ port })

		this.wss.on('close', () => {
			// The websocket server is closed.
			this._onServerClose()
		})
		this.wss.on('error', (err: any) => {
			this.log.error('Error in WebSocket server')
			this.log.error(err)
		})

		this.wss.on('connection', (ws) => {
			// A new client has connected

			const bridge = new WebsocketConnection(this.log, ws)
			this.addConnection(bridge)

			this.onConnection(bridge)
		})
	}

	connectToServer(url: string): WebsocketConnection {
		const bridge = new WebsocketConnection(this.log, url)
		this.addConnection(bridge)
		setImmediate(() => {
			// The connection might have been terminated already:
			if (bridge.terminated) return
			this.onConnection(bridge)
		})
		return bridge
	}
	private addConnection(connection: WebsocketConnection) {
		this.connections.push(connection)
		connection.on('close', () => {
			// Remove the connection, so that it can be garbage collected:
			const index = this.connections.indexOf(connection)
			if (index >= 0) this.connections.splice(index, 1)
		})
	}
	close(): void {
		this.wss.close()
		this._onServerClose() // Call this in case of the wss close event not firing.
	}
	private _onServerClose() {
		// Close the connections:
		const connections = this.connections
		this.connections = []
		connections.forEach((client) => {
			client.terminate()
		})

		if (!this.isClosed) {
			this.emit('close')
			this.isClosed = true
		}
	}
}

/**
 * Represents a connection to the other party.
 *
 */
export class WebsocketConnection extends EventEmitter {
	public connectionId: number = Date.now() + Math.random()
	private _connected = false
	private _terminated = false

	private pingInterval: NodeJS.Timeout | null = null
	private lastPingReceived = 0

	private reconnectInterval: NodeJS.Timeout | null = null

	private ws: WebSocket | null = null
	private url: string | null

	constructor(
		private log: LoggerLike,
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
	/** True if the connection has been terminated, and will not be used anymore */
	get terminated(): boolean {
		return this._terminated
	}

	/**
	 * Closes the connection for good (it will not reconnect).
	 * Emits 'close' (after 'disconnected'), then removes all listeners.
	 */
	terminate(): void {
		if (this._terminated) return
		this._terminated = true

		const wasConnected = this._connected
		this._connected = false
		if (wasConnected) this.emit('disconnected')

		if (this.pingInterval) {
			clearInterval(this.pingInterval)
			this.pingInterval = null
		}
		if (this.reconnectInterval) {
			clearInterval(this.reconnectInterval)
			this.reconnectInterval = null
		}
		this.ws?.close()
		this.ws = null

		this.emit('close')
		this.removeAllListeners()
	}
	send(message: unknown): void {
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
		// Note: Events from a ws that has been replaced (or from a terminated connection) are ignored,
		// otherwise they could trigger reconnections of an already terminated connection.
		ws.on('close', () => {
			if (this.ws !== ws) return
			this._onDisconnected()
		})
		ws.on('error', (err) => {
			if (this.ws !== ws) return
			if (!this.connected && `${err}`.match(/ECONNREFUSED/)) {
				// Yeah, we already know we are not connected..
				// Ignore.
			} else {
				this.log.error('Error in WebSocket connection')
				this.log.error(err)
			}
		})
		ws.on('ping', () => {
			if (this.ws !== ws) return
			this.lastPingReceived = Date.now()
		})
		ws.on('pong', () => {
			if (this.ws !== ws) return
			this.lastPingReceived = Date.now()
		})
		ws.on('message', (data) => {
			if (this.ws !== ws) return
			this._onMessage(data.toString())
		})
	}

	private _triggerReconnect() {
		if (this._terminated) return
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
		if (this._terminated) return
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
			if (this.ws !== ws) return
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
		if (this._terminated) return
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
				this.terminate() // Emits 'close'
				return
			}
		}

		if (this.isClient) {
			this._triggerReconnect()
		}
	}
}
