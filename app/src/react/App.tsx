import React, { useEffect, useState } from 'react'
const { ipcRenderer } = window.require('electron')

import { AppModel } from '@/models/AppModel'
import { APP_FEED_CHANNEL, SELECT_TIMELINE_OBJ_CHANNEL } from '@/ipc/channels'

import './styles/app.scss'
import { GroupListView } from './components/rundown/GroupList'
import { Sidebar } from './components/sidebar/Sidebar'
import { setupKeyTracker } from '@/lib/KeyTracker'

export const App = () => {
	const [appData, setAppData] = useState<AppModel>({
		groups: [],
		media: [],
		templates: [],
		mappings: undefined,
		selectedTimelineObjId: undefined,
	})

	setupKeyTracker()

	/**
	 * Main feed from backend
	 */
	useEffect(() => {
		// Ask backend for the data once ready
		ipcRenderer.send(APP_FEED_CHANNEL)

		// Save all app data received from backend
		ipcRenderer.on(APP_FEED_CHANNEL, (event, appModel: AppModel) => {
			setAppData(appModel)
		})
	}, [])

	const handleClickAnywhere: React.MouseEventHandler<HTMLDivElement> = (e) => {
		const tarEl = e.target as HTMLElement
		const isOnLayer = tarEl.closest('.object')
		const isOnSidebar = tarEl.closest('.sidebar')
		if (!isOnLayer && !isOnSidebar) {
			if (appData.selectedTimelineObjId) {
				ipcRenderer.send(SELECT_TIMELINE_OBJ_CHANNEL, undefined)
			}
		}
	}

	return (
		<div className="app" onClick={handleClickAnywhere}>
			<GroupListView appData={appData} selectedTimelineObjId={appData.selectedTimelineObjId} />
			<Sidebar appData={appData} />
		</div>
	)
}
