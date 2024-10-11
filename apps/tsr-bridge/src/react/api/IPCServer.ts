import { IPCServerMethods } from '../../ipc/IPCAPI.js'

type Promisify<T> = {
	[K in keyof T]: T[K] extends (...arg: any[]) => any
		? (...args: Parameters<T[K]>) => Promise<ReturnType<T[K]>>
		: T[K]
}

type ServerArgs<T extends keyof IPCServerMethods> = Parameters<IPCServerMethods[T]>
type ServerReturn<T extends keyof IPCServerMethods> = Promise<ReturnType<IPCServerMethods[T]>>

/** This class is used client-side, to send requests to the server */
export class IPCServer implements Promisify<IPCServerMethods> {
	constructor(private ipcRenderer: Electron.IpcRenderer) {}

	private async invokeServerMethod<T extends keyof IPCServerMethods>(methodname: T, ...args: any[]): ServerReturn<T> {
		// Stringifying and parsing data will convert Mobx observable objects into object literals.
		// Otherwise, Electron won't be able to clone it.
		return this.ipcRenderer.invoke(methodname, ...JSON.parse(JSON.stringify(args)))
	}

	async updateSettings(...args: ServerArgs<'updateSettings'>): ServerReturn<'updateSettings'> {
		return this.invokeServerMethod('updateSettings', ...args)
	}
	async initialized(...args: ServerArgs<'initialized'>): ServerReturn<'initialized'> {
		return this.invokeServerMethod('initialized', ...args)
	}
}
