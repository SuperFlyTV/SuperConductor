import { IPCClientMethods } from '../../ipc/IPCAPI'
import { LogEntry } from 'winston'

/** This class is used client-side, to handle messages from the server */
export class IPCClient implements IPCClientMethods {
	constructor(
		private ipcRenderer: Electron.IpcRenderer,
		private callbacks: {
			log: (entry: LogEntry) => void
		}
	) {
		this.handleCallMethod = this.handleCallMethod.bind(this)
		this.ipcRenderer.on('callMethod', this.handleCallMethod)
	}

	private handleCallMethod(_event: Electron.IpcRendererEvent, methodname: string, ...args: any[]): void {
		const fcn = (this as any)[methodname]
		if (!fcn) {
			// eslint-disable-next-line no-console
			console.error(`IPCClient: method ${methodname} not found`)
		} else {
			fcn.apply(this, args)
		}
	}

	log(entry: LogEntry): void {
		this.callbacks.log(entry)
	}
	destroy(): void {
		this.ipcRenderer.off('callMethod', this.handleCallMethod)
	}
}
