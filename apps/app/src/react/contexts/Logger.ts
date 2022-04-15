import React from 'react'

type LogFn = (...args: any[]) => void

type Log = {
	error: LogFn
	warn: LogFn
	info: LogFn
	HTTP: LogFn
	verbose: LogFn
	debug: LogFn
	silly: LogFn
}

/** Used to send logs to the backend where they are logged to the server console and written to disk. */
export const LoggerContext = React.createContext<Log>({} as Log)
