import { APP_FEED_CHANNEL } from '@/ipc/channels'
import { AppModel } from '@/models/AppModel'
import React, { useEffect, useState } from 'react'
const { ipcRenderer } = window.require('electron')

import './app.scss'
import { Group } from './rundown/Group'
import { Rundown } from './rundown/Rundown'

const App = () => {
	const [app, setApp] = useState<AppModel>([])

	useEffect(() => {
		ipcRenderer.on(APP_FEED_CHANNEL, (event, args: AppModel) => {
			console.log(args)
			setApp(args)
		})
	}, [])

	return (
		<div className="app">
			{app.map((rdOrGroup, idx) => {
				if (rdOrGroup.type === 'rundown') {
					return <Rundown key={idx} name={rdOrGroup.name} duration="01:02:03" timeline={rdOrGroup.timeline} />
				} else {
					// Recursively show rundowns and groups
				}
			})}
		</div>
	)
}

export default App
