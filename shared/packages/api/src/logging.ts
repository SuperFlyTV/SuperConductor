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

export type LogFn = (...args: any[]) => void

export type LoggerLike = {
	[LogLevel.Error]: LogFn
	[LogLevel.Warn]: LogFn
	[LogLevel.Info]: LogFn
	[LogLevel.HTTP]: LogFn
	[LogLevel.Verbose]: LogFn
	[LogLevel.Debug]: LogFn
	[LogLevel.Silly]: LogFn
}
