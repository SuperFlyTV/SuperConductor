import Transport from 'winston-transport'
import { LogEntry } from 'winston'
import { IPCClient } from '../electron/IPCClient.js'

export default class IPCTransport extends Transport {
	constructor(private ipcClient: IPCClient) {
		super()
	}

	log(entry: LogEntry, callback: (...args: unknown[]) => unknown): void {
		this.ipcClient.log(entry)
		callback()
	}
}
