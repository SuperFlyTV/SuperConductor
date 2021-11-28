import { IPCClientMethods } from '@/ipc/IPCAPI'
import { AppModel } from '@/models/AppModel'

/** This class is used client-side, to handle messages from the server */
export class IPCClient implements IPCClientMethods {
	constructor(
		private ipcRenderer: Electron.IpcRenderer,
		private callbacks: {
			setAppData: (data: AppModel) => void
		}
	) {
		ipcRenderer.on('callMethod', (event, methodname: string, ...args: any[]) => {
			const fcn = (this as any)[methodname]
			if (!fcn) {
				console.error(`IPCClient: method ${methodname} not found`)
			} else {
				fcn.apply(this, args)
			}
		})
	}

	appFeed(data: AppModel): void {
		this.callbacks.setAppData(data)
	}
}
