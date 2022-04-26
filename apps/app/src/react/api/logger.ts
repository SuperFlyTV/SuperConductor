import { LogLevel } from '@shared/api'
import { IPCServer } from './IPCServer'

export class ClientSideLogger {
	constructor(private serverAPI: IPCServer) {}

	/* eslint-disable no-console */
	error(...args: any[]): void {
		console.error(...args)
		this.serverAPI.log(LogLevel.Error, ...args).catch(console.error)
	}
	warn(...args: any[]): void {
		console.warn(...args)
		this.serverAPI.log(LogLevel.Warn, ...args).catch(console.error)
	}
	info(...args: any[]): void {
		console.info(...args)
		this.serverAPI.log(LogLevel.Info, ...args).catch(console.error)
	}
	http(...args: any[]): void {
		console.debug(...args)
		this.serverAPI.log(LogLevel.HTTP, ...args).catch(console.error)
	}
	verbose(...args: any[]): void {
		console.debug(...args)
		this.serverAPI.log(LogLevel.Verbose, ...args).catch(console.error)
	}
	debug(...args: any[]): void {
		console.debug(...args)
		this.serverAPI.log(LogLevel.Debug, ...args).catch(console.error)
	}
	silly(...args: any[]): void {
		console.debug(...args)
		this.serverAPI.log(LogLevel.Silly, ...args).catch(console.error)
	}
	/* eslint-enable no-console */
}
