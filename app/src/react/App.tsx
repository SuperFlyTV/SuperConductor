import React, { useEffect, useMemo, useState } from 'react'
const { ipcRenderer } = window.require('electron')

import './styles/app.scss'
import { RundownView } from './components/rundown/RundownView'
import { Sidebar } from './components/sidebar/Sidebar'
import { setupKeyTracker } from '@/lib/KeyTracker'
import { IPCClient } from './api/IPCClient'
import { IPCServer } from './api/IPCServer'
import { Project } from '@/models/project/Project'
import { Rundown } from '@/models/rundown/Rundown'
import { GUI, GUIContext } from './contexts/GUI'
import { IPCServerContext } from './contexts/IPCServer'
import { ProjectContext } from './contexts/Project'
import { TopHeader } from './components/top/TopHeader'
import { IPCServerMethods } from '@/ipc/IPCAPI'
import { Resources, ResourcesContext } from './contexts/Resources'
import { ResourceAny } from '@/models/resource/resource'
import { RundownContext } from './contexts/Rundown'
import { BridgeStatus } from '@/models/project/Bridge'

export const App = () => {
	// 	this.ipcClient?.updateProject(project)
	// })
	// this.storage.on('rundown', (fileName: string, rundown: Rundown) => {
	// 	this.ipcClient?.updateRundown(fileName, rundown)

	// 	groups: [],
	// 	media: [],
	// 	templates: [],
	// 	mappings: undefined,
	// })

	setupKeyTracker()

	const [resources, setResources] = useState<Resources>({})
	const [bridgeStatuses, setBridgeStatuses] = useState<{ [bridgeId: string]: BridgeStatus }>({})
	const [project, setProject] = useState<Project>()
	const [currentRundownId, setCurrentRundownId] = useState<string>()
	const [currentRundown, setCurrentRundown] = useState<Rundown>()

	const [openRundowns, setOpenRundowns] = useState<{ [rundownId: string]: { name: string } }>({})

	useEffect(() => {
		new IPCClient(ipcRenderer, {
			updateProject: (project: Project) => {
				setProject(project)
			},
			updateRundown: (rundownId: string, rundown: Rundown) => {
				if (!currentRundownId) {
					setCurrentRundownId(rundownId)
					setCurrentRundown(rundown)
				} else if (currentRundownId === rundownId) {
					setCurrentRundown(rundown)
				}

				setOpenRundowns((openRundowns) => {
					const newOpenRundowns = { ...openRundowns }
					if (rundown) {
						newOpenRundowns[rundownId] = { name: rundown.name }
					} else {
						delete newOpenRundowns[rundownId]
					}
					return newOpenRundowns
				})
			},
			updateResource: (resourceId: string, resource: ResourceAny | null) => {
				setResources((resources) => {
					const newResources = { ...resources }
					if (resource) {
						newResources[resourceId] = resource
					} else {
						delete newResources[resourceId]
					}
					return newResources
				})
			},
			updateBridgeStatus: (bridgeId: string, status: BridgeStatus | null) => {
				setBridgeStatuses((resources) => {
					const newStatuses = { ...resources }
					if (status) {
						newStatuses[bridgeId] = status
					} else {
						delete newStatuses[bridgeId]
					}
					return newStatuses
				})
			},
		})
	}, [])

	const serverAPI = useMemo<IPCServerMethods>(() => {
		return new IPCServer(ipcRenderer)
	}, [])
	useEffect(() => {
		// Ask backend for the data once ready:
		serverAPI.triggerSendAll()
	}, [])

	const [guiData, setGuiData] = useState<GUI>({})
	const guiContextValue = useMemo(() => {
		return {
			gui: guiData,
			updateGUI: (newGui: Partial<GUI>) => {
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
						selectedGroupId: undefined,
						selectedPartId: undefined,
						selectedTimelineObjId: undefined,
					}
				} else {
					// no change:
					return guiData
				}
			})
		}
	}

	if (!project) {
		return <div>Loading...</div>
	}

	const rundowns0 = Object.entries(openRundowns).map(([rundownId, openRundown]) => ({
		rundownId,
		name: openRundown.name,
	}))

	return (
		<GUIContext.Provider value={guiContextValue}>
			<IPCServerContext.Provider value={serverAPI}>
				<ProjectContext.Provider value={project}>
					<ResourcesContext.Provider value={resources}>
						<div className="app" onClick={handleClickAnywhere}>
							<div className="top-header">
								<TopHeader
									rundowns={rundowns0}
									onSelect={(rundownId) => {
										setCurrentRundownId(rundownId)
									}}
								/>
							</div>

							{currentRundown ? (
								<RundownContext.Provider value={currentRundown}>
									<div className="main-area">
										<RundownView />
									</div>
									<div className="side-bar">
										<Sidebar />
									</div>
								</RundownContext.Provider>
							) : (
								<div>Loading...</div>
							)}
						</div>
					</ResourcesContext.Provider>
				</ProjectContext.Provider>
			</IPCServerContext.Provider>
		</GUIContext.Provider>
	)
}
