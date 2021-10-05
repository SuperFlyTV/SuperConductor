import React, { useEffect } from 'react'
// const { ipcRenderer } = window.require('electron')

import './app.scss'
import { Playlist } from './rundown/Playlist'
import { Rundown } from './rundown/Rundown'

const App = () => {
	useEffect(() => {
		console.log('Setting it up...')
		// ipcRenderer.on('TEST', (args) => {
		// 	console.log('Got', args)
		// })
	}, [])
	return (
		<div className="app">
			<Playlist>
				<Rundown />
				<Rundown />
			</Playlist>
			<Rundown />
		</div>
	)
}

export default App
