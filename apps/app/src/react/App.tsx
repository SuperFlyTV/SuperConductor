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
import { createTheme, ThemeProvider, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material'
import { SnackbarProvider } from 'notistack'

export const App = () => {
	const [resources, setResources] = useState<Resources>({})
	const [bridgeStatuses, setBridgeStatuses] = useState<{ [bridgeId: string]: BridgeStatus }>({})
	const [project, setProject] = useState<Project>()
	const [currentRundownId, setCurrentRundownId] = useState<string>()
	const [currentRundown, setCurrentRundown] = useState<Rundown>()
	const currentRundownIdRef = useRef<string>()
	const [openRundowns, setOpenRundowns] = useState<{ [rundownId: string]: { name: string } }>({})
	const [settingsOpen, setSettingsOpen] = useState(false)

	useEffect(() => {
		currentRundownIdRef.current = currentRundownId
	}, [currentRundownId])

	const theme = React.useMemo(() => {
		return createTheme({
			palette: {
				mode: 'dark',
				primary: {
					main: '#e96703',
				},
			},
			typography: {
				/**
				 * This is needed to counteract the `font-size: 62.5%` style on the <html> tag.
				 * See https://mui.com/customization/typography/#font-size for more details.
				 */
				fontSize: 14 * 1.6,
			},
		})
	}, [])

	useEffect(() => {
		new IPCClient(ipcRenderer, {
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
			openSettings: () => {
				setSettingsOpen(true)
			},
		})
	}, [])

	const serverAPI = useMemo<IPCServer>(() => {
		return new IPCServer(ipcRenderer)
	}, [])
	useEffect(() => {
		// Ask backend for the data once ready:
		serverAPI.triggerSendAll().catch(console.error)
	}, [])

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

	if (!project) {
		return <div>Loading...</div>
	}

	const rundowns0 = Object.entries(openRundowns).map(([rundownId, openRundown]) => ({
		rundownId,
		name: openRundown.name,
	}))

	return (
		<DndProvider backend={HTML5Backend}>
			<HotkeyContext.Provider value={sorensen}>
				<GUIContext.Provider value={guiContextValue}>
					<IPCServerContext.Provider value={serverAPI}>
						<ProjectContext.Provider value={project}>
							<ResourcesContext.Provider value={resources}>
								<TimelineObjectMoveContext.Provider value={timelineObjectMoveContextValue}>
									<ThemeProvider theme={theme}>
										<SnackbarProvider maxSnack={1}>
											<div className="app" onPointerDown={handlePointerDownAnywhere}>
												<div className="top-header">
													<TopHeader
														rundowns={rundowns0}
														onSelect={(rundownId) => {
															setCurrentRundownId(rundownId)
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
										</SnackbarProvider>
									</ThemeProvider>
								</TimelineObjectMoveContext.Provider>
							</ResourcesContext.Provider>
						</ProjectContext.Provider>
					</IPCServerContext.Provider>
				</GUIContext.Provider>
			</HotkeyContext.Provider>
		</DndProvider>
	)
}
