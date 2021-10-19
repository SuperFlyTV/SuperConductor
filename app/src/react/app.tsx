import React, { useEffect, useState } from 'react'
import Rundowns from './components/rundowns/Rundowns'
import { Sidebar } from './components/sidebar/Sidebar'
const { ipcRenderer } = window.require('electron')

import './styles/app.scss'
import { AppModel } from '@/models/AppModel'
import { APP_FEED_CHANNEL } from '@/ipc/channels'

export const App = () => {
	const [appData, setAppData] = useState<AppModel>({ rundowns: [], media: [] })

	useEffect(() => {
		ipcRenderer.on(APP_FEED_CHANNEL, (event, args: AppModel) => {
			// console.log(APP_FEED_CHANNEL, args)
			setAppData(args)
		})
	}, [])

	return (
		<div className="app">
			<Rundowns appData={appData} selectedTimelineObjId={appData.selectedTimelineObjId} />
			<Sidebar appData={appData} />
		</div>
	)
}
