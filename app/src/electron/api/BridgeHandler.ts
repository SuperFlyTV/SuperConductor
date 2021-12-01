// import WebSocket from 'ws'

// const SERVER_PORT = 5259
// const PING_INTERVAL = 5000
// /*

// Notes:

// * Both the Bridge or the TPT can be the one initializing a connection.
// * The "Client" is the one who initialized the connection (to the "Server")

// * TPT should ping the bridge every 5 seconds to keep the connection alive.

// */

// export class BridgeHandler {
// 	private wss: WebSocket.Server

// 	private connectedBridges: BridgeConnection[] = []

// 	constructor(private onConnection: (bridge: BridgeConnection) => void) {
// 		this.wss = new WebSocket.Server({ port: SERVER_PORT })

// 		this.wss.on('close', () => {
// 			// The websocekt server is closed.
// 			// this.clients.forEach((client) => {
// 			// 	this.clients = []
// 			// 	client._onLostConnection()
// 			// })
// 			// this.emit('close')
// 		})
// 		this.wss.on('error', (err: any) => {
// 			console.log('Error in WebSocket server')
// 			console.log(err)
// 		})

// 		this.wss.on('connection', (ws) => {
// 			// A new client has connected

// 			const bridge = new BridgeConnection(ws)
// 			this.connectedBridges.push(bridge)

// 			this.onConnection(bridge)

// 			// client.once('close', () => {
// 			// 	// Remove client from the list of clients
// 			// 	this.clients = this.clients.filter((c) => c !== client)
// 			// })

// 			// client.once('clientTypeReceived', () => {
// 			// 	// client.clientType has now been set
// 			// 	this.onConnection(client)
// 			// })
// 			// client.on('error', (err) => {
// 			// 	console.log(`WebsocketServer ws error: ${stringifyError(err)}`)
// 			// 	// TODO: should we close the client?
// 			// 	// client.close()
// 			// })
// 		})
// 	}

// 	connectToBridge(url: string) {
// 		const ws = new WebSocket(url)

// 		// ws.on('ping', () => this.watchForHeartbeat())
// 		// ws.once('close', () => {
// 		//     // if (this.pingTimeout) clearTimeout(this.pingTimeout)
// 		//     this.onLostConnection()
// 		// })
// 		// ws.on('message', (message: string) => {
// 		//     this.handleReceivedMessage(JSON.parse(message))
// 		// })
// 	}
// }

// export class BridgeConnection {
// 	private connected = false
// 	private pingInterval: NodeJS.Timeout | null = null

// 	private id: string | null = null

// 	constructor(private ws: WebSocket, waitForConnection: boolean) {
// 		if (waitForConnection) {
// 			this.ws.once('open', () => {
// 				this._onConnected()
// 			})
// 		} else {
// 			this._onConnected()
// 		}
// 	}

// 	private _onConnected() {
// 		this.connected = true

// 		// Setup pinging
// 		if (this.pingInterval) {
// 			clearInterval(this.pingInterval)
// 			this.pingInterval = null
// 		}
// 		this.pingInterval = setInterval(() => {
// 			PING_INTERVAL
// 		})
// 	}
// 	private _onDisconnected() {
// 		this.connected = false

// 		if (this.pingInterval) {
// 			clearInterval(this.pingInterval)
// 			this.pingInterval = null
// 		}
// 	}
// }

// export namespace BridgeAPI {
// 	export type MessageAny = MessageInit

// 	export interface MessageBase {
// 		type: string
// 	}

// 	export interface MessageInit extends MessageBase {
// 		type: 'init'
// 	}
// }
