import { MAIN_CHANNEL } from '@/ipc/channels'
import { AppModel } from '@/models/AppModel'
import React, { useEffect, useState } from 'react'
const { ipcRenderer } = window.require('electron')

import './app.scss'
import { Playlist } from './rundown/Playlist'
import { Rundown } from './rundown/Rundown'

const App = () => {
	const [app, setApp] = useState<AppModel>([])

	useEffect(() => {
		ipcRenderer.on(MAIN_CHANNEL, (event, args: AppModel) => {
			console.log(args)
			setApp(args)
		})
	}, [])

	return (
		<div className="app">
			{app.map((rd, idx) => {
				if (rd.type === 'rundown') {
					return <Rundown key={idx} name={rd.name} duration="01:02:03" timeline={rd.timeline} />
				}
			})}
			{/* <Playlist>
				<Rundown />
				<Rundown />
			</Playlist>
			<Rundown /> */}
		</div>
	)
}

export default App
