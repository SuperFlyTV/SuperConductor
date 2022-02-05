import React, { useEffect, useMemo, useRef, useState } from 'react'
const { ipcRenderer } = window.require('electron')

import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import './styles/app.scss'
import { RundownView } from './components/rundown/RundownView'
import { Sidebar } from './components/sidebar/Sidebar'
import sorensen from '@sofie-automation/sorensen'
import { IPCClient } from './api/IPCClient'
import { IPCServer } from './api/IPCServer'
import { Project } from '../models/project/Project'
import { Rundown } from '../models/rundown/Rundown'
import { GUI, GUIContext } from './contexts/GUI'
import { IPCServerContext } from './contexts/IPCServer'
import { ProjectContext } from './contexts/Project'
import { TopHeader } from './components/top/TopHeader'
import { Resources, ResourcesContext } from './contexts/Resources'
import { ResourceAny } from '@shared/models'
import { RundownContext } from './contexts/Rundown'
import { BridgeStatus } from '../models/project/Bridge'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { HotkeyContext } from './contexts/Hotkey'
import { TimelineObjectMove, TimelineObjectMoveContext } from './contexts/TimelineObjectMove'
import { Settings } from './components/settings/Settings'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material'
import { useSnackbar } from 'notistack'
import { AppData } from '../models/App/AppData'

const ErrorCruftRegex = /^Error invoking remote method '.+': /

export const App = () => {
	const [resources, setResources] = useState<Resources>({})
	const [bridgeStatuses, setBridgeStatuses] = useState<{ [bridgeId: string]: BridgeStatus }>({})
	const [appData, setAppData] = useState<AppData>()
	const [project, setProject] = useState<Project>()
	const [currentRundownId, setCurrentRundownId] = useState<string>()
	const [currentRundown, setCurrentRundown] = useState<Rundown>()
	const currentRundownIdRef = useRef<string>()
	const [settingsOpen, setSettingsOpen] = useState(false)
	const { enqueueSnackbar } = useSnackbar()

	useEffect(() => {
		currentRundownIdRef.current = currentRundownId
	}, [currentRundownId])

	useEffect(() => {
		const ipcClient = new IPCClient(ipcRenderer, {
			updateAppData: (appData: AppData) => {
				setAppData(appData)
			},
			updateProject: (project: Project) => {
				setProject(project)
			},
			updateRundown: (rundownId: string, rundown: Rundown) => {
				if (!currentRundownIdRef.current) {
					setCurrentRundownId(rundownId)
					setCurrentRundown(rundown)
				} else if (currentRundownIdRef.current === rundownId) {
					setCurrentRundown(rundown)
				}
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
			openSettings: () => {
				setSettingsOpen(true)
			},
		})

		return () => {
			ipcClient.destroy()
		}
	}, [])

	const serverAPI = useMemo<IPCServer>(() => {
		return new IPCServer(ipcRenderer)
	}, [])
	useEffect(() => {
		// Ask backend for the data once ready:
		serverAPI.triggerSendAll().catch(console.error)
	}, [serverAPI])
	useEffect(() => {
		// Ask the backend for the rundown whenever currentRundownId changes.
		if (currentRundownId) {
			serverAPI.triggerSendRundown({ rundownId: currentRundownId }).catch(console.error)
		} else {
			setCurrentRundown(undefined)
		}
	}, [currentRundownId, serverAPI])

	const [guiData, setGuiData] = useState<GUI>({ selectedTimelineObjIds: [] })
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

	const [timelineObjectMoveData, setTimelineObjectMoveData] = useState<TimelineObjectMove>({
		moveType: null,
		wasMoved: null,
		partId: null,
	})
	const timelineObjectMoveContextValue = useMemo(() => {
		return {
			move: timelineObjectMoveData,
			updateMove: (newData: Partial<TimelineObjectMove>) => {
				setTimelineObjectMoveData({
					...timelineObjectMoveData,
					...newData,
				})
			},
		}
	}, [timelineObjectMoveData])

	const handlePointerDownAnywhere: React.MouseEventHandler<HTMLDivElement> = (e) => {
		const tarEl = e.target as HTMLElement
		const isOnLayer = tarEl.closest('.object')
		const isOnSidebar = tarEl.closest('.side-bar')
		if (!isOnLayer && !isOnSidebar && !timelineObjectMoveData.partId) {
			setGuiData((guiData) => {
				if (guiData.selectedTimelineObjIds.length > 0) {
					return {
						...guiData,
						selectedGroupId: undefined,
						selectedPartId: undefined,
						selectedTimelineObjIds: [],
					}
				} else {
					// no change:
					return guiData
				}
			})
		}
	}

	useEffect(() => {
		sorensen.init().catch(console.error)
	}, [])

	const handleSettingsClose = () => {
		setSettingsOpen(false)
	}

	const openRundowns = useMemo(() => {
		if (!appData) {
			return []
		}

		return Object.entries(appData.rundowns)
			.filter(([_rundownId, rundown]) => {
				return rundown.open === true
			})
			.map(([rundownId, closedRundown]) => ({
				rundownId,
				name: closedRundown.name,
			}))
	}, [appData])

	const closedRundowns = useMemo(() => {
		if (!appData) {
			return []
		}

		return Object.entries(appData.rundowns)
			.filter(([_rundownId, rundown]) => {
				return rundown.open === false
			})
			.map(([rundownId, closedRundown]) => ({
				rundownId,
				name: closedRundown.name,
			}))
	}, [appData])

	const handleError = (error: unknown): void => {
		console.error(error)
		if (typeof error === 'object' && error !== null && 'message' in error) {
			enqueueSnackbar((error as any).message.replace(ErrorCruftRegex, ''), { variant: 'error' })
		} else if (typeof error === 'string') {
			enqueueSnackbar(error.replace(ErrorCruftRegex, ''), { variant: 'error' })
		} else {
			enqueueSnackbar('Unknown error, see console for details.', { variant: 'error' })
		}
	}

	if (!project) {
		return <div>Loading...</div>
	}

	return (
		<DndProvider backend={HTML5Backend}>
			<HotkeyContext.Provider value={sorensen}>
				<GUIContext.Provider value={guiContextValue}>
					<IPCServerContext.Provider value={serverAPI}>
						<ProjectContext.Provider value={project}>
							<ResourcesContext.Provider value={resources}>
								<TimelineObjectMoveContext.Provider value={timelineObjectMoveContextValue}>
									<div className="app" onPointerDown={handlePointerDownAnywhere}>
										<div className="top-header">
											<TopHeader
												selectedRundownId={currentRundownId}
												openRundowns={openRundowns}
												closedRundowns={closedRundowns}
												onSelect={(rundownId) => {
													setCurrentRundownId(rundownId)
												}}
												onClose={(rundownId) => {
													serverAPI.closeRundown({ rundownId }).catch(handleError)
													if (openRundowns.length > 0) {
														setCurrentRundownId(openRundowns[0].rundownId)
													} else {
														setCurrentRundownId(undefined)
													}
												}}
												onOpen={(rundownId) => {
													serverAPI.openRundown({ rundownId }).catch(handleError)
												}}
												onCreate={(rundownName) => {
													serverAPI.newRundown({ name: rundownName }).catch(handleError)
												}}
												onRename={(rundownId, newName) => {
													serverAPI.renameRundown({ rundownId, newName }).catch(handleError)
												}}
												bridgeStatuses={bridgeStatuses}
											/>
										</div>

										{currentRundown ? (
											<RundownContext.Provider value={currentRundown}>
												<div className="main-area">
													<RundownView mappings={project.mappings} />
												</div>
												<div className="side-bar">
													<Sidebar mappings={project.mappings} />
												</div>
											</RundownContext.Provider>
										) : (
											<div>Loading...</div>
										)}

										<Dialog open={settingsOpen} onClose={handleSettingsClose}>
											<DialogTitle>Preferences</DialogTitle>
											<DialogContent className="settings-dialog">
												<Settings project={project} />
											</DialogContent>
											<DialogActions>
												<Button onClick={handleSettingsClose}>Close</Button>
											</DialogActions>
										</Dialog>
									</div>
								</TimelineObjectMoveContext.Provider>
							</ResourcesContext.Provider>
						</ProjectContext.Provider>
					</IPCServerContext.Provider>
				</GUIContext.Provider>
			</HotkeyContext.Provider>
		</DndProvider>
	)
}
