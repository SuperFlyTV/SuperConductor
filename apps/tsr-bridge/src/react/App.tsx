import React, { useEffect, useRef, useState } from 'react'
const { ipcRenderer } = window.require('electron')
import { LogEntry as LogEntryType } from 'winston'
import { Log } from './components/log/Log'
import { LogEntry } from './components/log/LogEntry'
import { IPCClient } from './api/IPCClient'
import './styles/app.scss'

const MAX_LOG_ENTRIES = 1000

export const App: React.FC = () => {
	const [logEntries, setLogEntries] = useState<LogEntryType[]>([])
	const logEntriesRef = useRef<LogEntryType[]>(logEntries)
	logEntriesRef.current = logEntries

	// Handle IPC-messages from server
	useEffect(() => {
		const ipcClient = new IPCClient(ipcRenderer, {
			log: (entry) => {
				setLogEntries([...logEntriesRef.current.slice(-MAX_LOG_ENTRIES + 1), entry])
			},
		})

		return () => {
			ipcClient.destroy()
		}
	}, [])

	return (
		<div className="app">
			<Log>
				{logEntries.map((logEntry, index) => (
					<LogEntry key={index} entry={logEntry} />
				))}
			</Log>
		</div>
	)
}
