import winston from 'winston'
// @ts-expect-error This is a hack to ensure that electron-builder includes this file.
import consoleTransport from 'winston/dist/winston/transports/console'
import { utilFormatter } from './util-formatter'
import DailyRotateFile from 'winston-daily-rotate-file'

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

export const createLogger = (dirname: string) => {
	return winston.createLogger({
		level: LogLevel.Silly,
		format: utilFormatter(),
		transports: [
			new consoleTransport({
				format: winston.format.simple(),
			}),
			new DailyRotateFile({
				format: winston.format.combine(winston.format.timestamp(), winston.format.simple()),
				dirname,
				filename: 'SuperConductor-%DATE%.log',
				maxSize: '20m',
				maxFiles: '30d',
				createSymlink: true,
			}),
		],
	})
}
