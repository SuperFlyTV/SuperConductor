import React, { useEffect, useMemo, useRef, useState } from 'react'
const { ipcRenderer } = window.require('electron')
import { LogEntry as LogEntryType } from 'winston'
import { Log } from './components/log/Log.js'
import { LogEntry } from './components/log/LogEntry.js'
import { IPCClient } from './api/IPCClient.js'
import { Settings } from './components/Settings.js'
import { AppSettings, AppSystem } from '../models/AppData.js'
import { IPCServerContext } from './contexts/IPCServer.js'
import { IPCServer } from './api/IPCServer.js'

import './styles/app.scss'
import 'react-toggle/style.css'

const MAX_LOG_ENTRIES = 1000

export const App: React.FC = () => {
	const [logEntries, setLogEntries] = useState<LogEntryType[]>([])
	const [settings, setSettings] = useState<AppSettings | undefined>(undefined)
	const [system, setSystem] = useState<AppSystem | undefined>(undefined)
	const logEntriesRef = useRef<LogEntryType[]>(logEntries)
	logEntriesRef.current = logEntries

	function log(entry: LogEntryType) {
		setLogEntries([...logEntriesRef.current.slice(-MAX_LOG_ENTRIES + 1), entry])
	}
	function logError(err: any) {
		log({
			level: 'error',
			message: `${err}` + (typeof err === 'object' && err.stack ? ` ${err.stack}` : ''),
		})
	}

	const serverAPI = useMemo<IPCServer>(() => {
		return new IPCServer(ipcRenderer)
	}, [])

	// On startup:
	useEffect(() => {
		serverAPI.initialized().catch(logError)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// Handle IPC-messages from server
	useEffect(() => {
		const ipcClient = new IPCClient(ipcRenderer, {
			log: (entry) => {
				log(entry)
			},
			settings: (newSettings: AppSettings) => {
				setSettings(newSettings)
			},
			system: (newSystem: AppSystem) => {
				setSystem(newSystem)
			},
		})

		return () => {
			ipcClient.destroy()
		}
	}, [])

	return (
		<div className="app">
			<IPCServerContext.Provider value={serverAPI}>
				{settings && system && <Settings settings={settings} system={system} />}
			</IPCServerContext.Provider>

			<Log>
				{logEntries.map((logEntry, index) => (
					<LogEntry key={index} entry={logEntry} />
				))}
			</Log>
		</div>
	)
}
