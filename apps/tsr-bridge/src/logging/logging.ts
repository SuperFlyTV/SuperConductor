import * as Winston from 'winston'
// @ts-expect-error This is a hack to ensure that electron-builder includes this file.
import consoleTransport from 'winston/dist/winston/transports/console'
import { IPCClient } from '../electron/IPCClient'
import IPCTransport from './ipc-transport'
import { utilFormatter } from './util-formatter'

/**
 * https://github.com/winstonjs/winston#logging-levels
 */
export enum LogLevel {
	Error = 'error',
	Warn = 'warn',
	Info = 'info',
	HTTP = 'http',
	Verbose = 'verbose',
	Debug = 'debug',
	Silly = 'silly',
}

export const createLogger = (): Winston.Logger => {
	const log = Winston.createLogger({
		level: LogLevel.Silly,
		format: utilFormatter(),
		transports: [
			new consoleTransport({
				format: Winston.format.simple(),
			}),
		],
	})

	return log
}
export function addLoggerTransport(log: Winston.Logger, ipcClient: IPCClient): void {
	log.add(new IPCTransport(ipcClient))
}
