import { format, createLogger, transports } from 'winston'
import { utilFormatter } from './util-formatter'
import DailyRotateFile from 'winston-daily-rotate-file'
import { LogLevel } from '@shared/api'
import winston from 'winston'

const myFormat = format.printf(({ level, message, label, timestamp }) => {
	return `${timestamp} [${label}] ${level}: ${message}`
})

export const createLoggers = (dirname: string): { electronLogger: winston.Logger; rendererLogger: winston.Logger } => {
	const myTransports = [
		new transports.Console(),
		new DailyRotateFile({
			dirname,
			filename: 'SuperConductor-%DATE%.log',
			maxSize: '20m',
			maxFiles: '30d',
			createSymlink: true,
		}),
	]

	const electronLogger = createLogger({
		level: LogLevel.Silly,
		format: format.combine(
			format.label({ label: 'electron' }),
			format.timestamp(),
			utilFormatter(),
			format.simple(),
			myFormat
		),
		transports: myTransports,
	})

	const rendererLogger = createLogger({
		level: LogLevel.Silly,
		format: format.combine(
			format.label({ label: 'renderer' }),
			format.timestamp(),
			utilFormatter(),
			format.simple(),
			myFormat
		),
		transports: myTransports,
	})

	return { electronLogger, rendererLogger }
}
