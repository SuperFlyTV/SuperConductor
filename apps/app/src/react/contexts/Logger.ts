import { LoggerLike } from '@shared/api'
import React from 'react'

/** Used to send logs to the backend where they are logged to the server console and written to disk. */
export const LoggerContext = React.createContext<LoggerLike>({
	/* eslint-disable no-console */
	error: (...args: any[]) => {
		console.error(...args)
	},
	warn: (...args: any[]) => {
		console.warn(...args)
	},
	info: (...args: any[]) => {
		console.info(...args)
	},
	http: (...args: any[]) => {
		console.debug(...args)
	},
	verbose: (...args: any[]) => {
		console.debug(...args)
	},
	debug: (...args: any[]) => {
		console.debug(...args)
	},
	silly: (...args: any[]) => {
		console.debug(...args)
	},
	/* eslint-enable no-console */
})
