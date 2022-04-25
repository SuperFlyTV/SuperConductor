import { format, createLogger } from 'winston'
// @ts-expect-error This is a hack to ensure that electron-builder includes this file.
import consoleTransport from 'winston/dist/winston/transports/console'
import { utilFormatter } from './util-formatter'
import DailyRotateFile from 'winston-daily-rotate-file'
import { LogLevel } from './log-levels'

const myFormat = format.printf(({ level, message, label, timestamp }) => {
	return `${timestamp} [${label}] ${level}: ${message}`
})

export const createLoggers = (dirname: string) => {
	const transports = [
		new consoleTransport(),
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
		transports,
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
		transports,
	})

	return { electronLogger, rendererLogger }
}
