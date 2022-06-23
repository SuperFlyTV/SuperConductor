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
		this.serverAPI.log(LogLevel.Error, this.fixArgs(...args)).catch(console.error)
	}
	warn(...args: any[]): void {
		console.warn(...args)
		this.serverAPI.log(LogLevel.Warn, this.fixArgs(...args)).catch(console.error)
	}
	info(...args: any[]): void {
		console.info(...args)
		this.serverAPI.log(LogLevel.Info, this.fixArgs(...args)).catch(console.error)
	}
	http(...args: any[]): void {
		console.debug(...args)
		this.serverAPI.log(LogLevel.HTTP, this.fixArgs(...args)).catch(console.error)
	}
	verbose(...args: any[]): void {
		console.debug(...args)
		this.serverAPI.log(LogLevel.Verbose, this.fixArgs(...args)).catch(console.error)
	}
	debug(...args: any[]): void {
		console.debug(...args)
		this.serverAPI.log(LogLevel.Debug, this.fixArgs(...args)).catch(console.error)
	}
	silly(...args: any[]): void {
		console.debug(...args)
		this.serverAPI.log(LogLevel.Silly, this.fixArgs(...args)).catch(console.error)
	}
	/* eslint-enable no-console */
}
