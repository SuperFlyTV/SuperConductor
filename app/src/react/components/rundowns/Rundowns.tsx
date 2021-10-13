import React, { useEffect, useState } from 'react'
const { ipcRenderer } = window.require('electron')

import { APP_FEED_CHANNEL } from '@/ipc/channels'
import { AppModel } from '@/models/AppModel'

import { Rundown } from '../../rundown/Rundown'

const Rundowns = () => {
	const [app, setApp] = useState<AppModel>([])

	useEffect(() => {
		ipcRenderer.on(APP_FEED_CHANNEL, (event, args: AppModel) => {
			console.log(args)
			setApp(args)
		})
	}, [])

	return (
		<div className="rundowns">
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

export default Rundowns
