import React, { useEffect, useMemo, useState } from 'react'
const { ipcRenderer } = window.require('electron')

import { AppModel } from '@/models/AppModel'

import './styles/app.scss'
import { GroupListView } from './components/rundown/GroupListView'
import { Sidebar } from './components/sidebar/Sidebar'
import { setupKeyTracker } from '@/lib/KeyTracker'
import { IPCClient } from './api/IPCClient'
import { IPCServer } from './api/IPCServer'
import { GUIModel } from '@/models/GUIModel'

export const IPCServerContext = React.createContext<IPCServer>({} as IPCServer)
export const GUIContext = React.createContext<{
	gui: GUIModel
	updateGUI: (newGui: Partial<GUIModel>) => void
}>({
	gui: {},
	updateGUI: () => {},
})

export const App = () => {
	const [appData, setAppData] = useState<AppModel>({
		groups: [],
		media: [],
		templates: [],
		mappings: undefined,
	})

	setupKeyTracker()

	/**
	 * Main feed from backend
	 */
	useEffect(() => {
		new IPCClient(ipcRenderer, {
			setAppData: (appModel) => {
				setAppData(appModel)
			},
		})

		// const serverApi = new IPCServer(ipcRenderer)

		// // Ask backend for the data once ready
		// ipcRenderer.send(APP_FEED_CHANNEL)
	}, [])

	const serverAPI = useMemo(() => {
		return new IPCServer(ipcRenderer)
	}, [])

	useEffect(() => {
		// Ask backend for the data once ready
		serverAPI.triggerAppFeed()
	}, [])
	const [guiData, setGuiData] = useState<GUIModel>({})
	const guiContextValue = useMemo(() => {
		return {
			gui: guiData,
			updateGUI: (newGui: Partial<GUIModel>) => {
				setGuiData({
					...guiData,
					...newGui,
				})
			},
		}
	}, [guiData])

	const handleClickAnywhere: React.MouseEventHandler<HTMLDivElement> = (e) => {
		const tarEl = e.target as HTMLElement
		const isOnLayer = tarEl.closest('.object')
		const isOnSidebar = tarEl.closest('.sidebar')
		if (!isOnLayer && !isOnSidebar) {
			setGuiData((guiData) => {
				if (guiData.selectedTimelineObjId) {
					return {
						...guiData,
						selectedTimelineObjId: undefined,
					}
				} else {
					// no change:
					return guiData
				}
			})
		}
	}

	return (
		<GUIContext.Provider value={guiContextValue}>
			<IPCServerContext.Provider value={serverAPI}>
				<div className="app" onClick={handleClickAnywhere}>
					<GroupListView appData={appData} />
					<Sidebar appData={appData} />
				</div>
			</IPCServerContext.Provider>
		</GUIContext.Provider>
	)
}
