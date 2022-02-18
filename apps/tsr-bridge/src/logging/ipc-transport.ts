import Transport from 'winston-transport'
import { LogEntry } from 'winston'
import { IPCClient } from '../electron/IPCClient'

export default class IPCTransport extends Transport {
	constructor(private ipcClient: IPCClient) {
		super()
	}

	log(entry: LogEntry, callback: (...args: unknown[]) => unknown) {
		this.ipcClient.log(entry)
		callback()
	}
}
