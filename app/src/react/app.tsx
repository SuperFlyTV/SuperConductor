import React, { useEffect, useState } from 'react'
import Rundowns from './components/rundown/Rundowns'
import { Sidebar } from './components/sidebar/Sidebar'
const { ipcRenderer } = window.require('electron')

import { AppModel } from '@/models/AppModel'
import { APP_FEED_CHANNEL, SELECT_TIMELINE_OBJ_CHANNEL } from '@/ipc/channels'

import './styles/app.scss'

export const App = () => {
	const [appData, setAppData] = useState<AppModel>({ rundowns: [], media: [], templates: [], mappings: undefined })

	/**
	 * Main feed from backend
	 */
	useEffect(() => {
		// Ask backend for the data once ready
		ipcRenderer.send(APP_FEED_CHANNEL)

		// Save all app data received from backend
		ipcRenderer.on(APP_FEED_CHANNEL, (event, args: AppModel) => {
			setAppData(args)
		})
	}, [])

	const handleClickAnywhere: React.MouseEventHandler<HTMLDivElement> = (e) => {
		const tarEl = e.target as HTMLElement
		const isOnLayer = tarEl.closest('.object')
		const isOnSidebar = tarEl.closest('.sidebar')
		if (!isOnLayer && !isOnSidebar) {
			ipcRenderer.send(SELECT_TIMELINE_OBJ_CHANNEL, undefined)
		}
	}

	return (
		<div className="app" onClick={handleClickAnywhere}>
			<Rundowns appData={appData} selectedTimelineObjId={appData.selectedTimelineObjId} />
			<Sidebar appData={appData} />
		</div>
	)
}
