import { LogLevel } from '@shared/api'
import { stringifyError } from '@shared/lib'
import { IPCServer } from './IPCServer'

export class ClientSideLogger {
	constructor(private serverAPI: IPCServer) {}

	private fixArgs(...args: any[]) {
		return args.map((arg) => stringifyError(arg))
	}

	/* eslint-disable no-console */
	error(...args: any[]): void {
		console.error(...args)
		this.serverAPI.log({ level: LogLevel.Error, params: this.fixArgs(...args) }).catch(console.error)
	}
	warn(...args: any[]): void {
		console.warn(...args)
		this.serverAPI.log({ level: LogLevel.Warn, params: this.fixArgs(...args) }).catch(console.error)
	}
	info(...args: any[]): void {
		console.info(...args)
		this.serverAPI.log({ level: LogLevel.Info, params: this.fixArgs(...args) }).catch(console.error)
	}
	http(...args: any[]): void {
		console.debug(...args)
		this.serverAPI.log({ level: LogLevel.HTTP, params: this.fixArgs(...args) }).catch(console.error)
	}
	verbose(...args: any[]): void {
		console.debug(...args)
		this.serverAPI.log({ level: LogLevel.Verbose, params: this.fixArgs(...args) }).catch(console.error)
	}
	debug(...args: any[]): void {
		console.debug(...args)
		this.serverAPI.log({ level: LogLevel.Debug, params: this.fixArgs(...args) }).catch(console.error)
	}
	silly(...args: any[]): void {
		console.debug(...args)
		this.serverAPI.log({ level: LogLevel.Silly, params: this.fixArgs(...args) }).catch(console.error)
	}
	/* eslint-enable no-console */
}
