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
import { HotkeyContext } from './contexts/Hotkey'
import { TimelineObjectMove, TimelineObjectMoveContext } from './contexts/TimelineObjectMove'
import { Settings } from './components/settings/Settings'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material'
import { useSnackbar } from 'notistack'
import { AppData } from '../models/App/AppData'
import { ErrorHandlerContext } from './contexts/ErrorHandler'
import { deepClone } from '@shared/lib'
import { PartMove, PartMoveContext } from './contexts/PartMove'
import { Group } from '../models/rundown/Group'
import { getDefaultGroup } from '../electron/defaults'
import { allowMovingItemIntoGroup } from '../lib/util'
import short from 'short-uuid'

/**
 * Used to remove unnecessary cruft from error messages.
 */
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
	const [waitingForMovePartUpdate, setWaitingForMovePartUpdate] = useState(false)
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

	const handleError = useMemo(() => {
		return (error: unknown): void => {
			console.error(error)
			if (typeof error === 'object' && error !== null && 'message' in error) {
				enqueueSnackbar((error as any).message.replace(ErrorCruftRegex, ''), { variant: 'error' })
			} else if (typeof error === 'string') {
				enqueueSnackbar(error.replace(ErrorCruftRegex, ''), { variant: 'error' })
			} else {
				enqueueSnackbar('Unknown error, see console for details.', { variant: 'error' })
			}
		}
	}, [enqueueSnackbar])

	const errorHandlerContextValue = useMemo(() => {
		return {
			handleError,
		}
	}, [handleError])

	const serverAPI = useMemo<IPCServer>(() => {
		return new IPCServer(ipcRenderer)
	}, [])
	useEffect(() => {
		// Ask backend for the data once ready:
		serverAPI.triggerSendAll().catch(handleError)
	}, [handleError, serverAPI])
	useEffect(() => {
		// Ask the backend for the rundown whenever currentRundownId changes.
		if (currentRundownId) {
			serverAPI.triggerSendRundown({ rundownId: currentRundownId }).catch(handleError)
		} else {
			setCurrentRundown(undefined)
		}
	}, [currentRundownId, handleError, serverAPI])

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
		hoveredLayerId: null,
		moveId: null,
	})
	const timelineObjectMoveContextValue = useMemo(() => {
		return {
			timelineObjMove: timelineObjectMoveData,
			updateTimelineObjMove: (newData: Partial<TimelineObjectMove>) => {
				setTimelineObjectMoveData({
					...timelineObjectMoveData,
					...newData,
				})
			},
		}
	}, [timelineObjectMoveData])

	const [partMoveData, setPartMoveData] = useState<PartMove>({
		duplicate: null,
		partId: null,
		fromGroupId: null,
		toGroupId: null,
		position: null,
		moveId: null,
		done: null,
	})
	const partMoveContextValue = useMemo(() => {
		return {
			partMove: partMoveData,
			updatePartMove: (newData: Partial<PartMove>) => {
				setPartMoveData({
					...partMoveData,
					...newData,
				})
			},
		}
	}, [partMoveData])

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

	const modifiedCurrentRundown = useMemo<Rundown | undefined>(() => {
		if (!currentRundown) {
			return currentRundown
		}

		const modifiedRundown = deepClone(currentRundown)

		if (partMoveData.partId) {
			if (typeof partMoveData.position !== 'number') {
				return currentRundown
			}

			const fromGroup = modifiedRundown.groups.find((g) => g.id === partMoveData.fromGroupId)

			if (!fromGroup) {
				return currentRundown
			}

			const part = fromGroup.parts.find((p) => p.id === partMoveData.partId)

			if (!part) {
				return currentRundown
			}

			let toGroup: Group | undefined
			let madeNewTransparentGroup = false
			const isTransparentGroupMove = fromGroup.transparent && partMoveData.toGroupId === null

			if (partMoveData.toGroupId) {
				toGroup = modifiedRundown.groups.find((g) => g.id === partMoveData.toGroupId)
			} else {
				if (isTransparentGroupMove) {
					toGroup = fromGroup
				} else {
					toGroup = {
						...getDefaultGroup(),

						id: short.generate(),
						name: part.name,
						transparent: true,

						parts: [part],
					}
					madeNewTransparentGroup = true
				}
			}

			if (!toGroup) {
				return currentRundown
			}

			const allow = allowMovingItemIntoGroup(part.id, fromGroup, toGroup)

			if (!allow) {
				return currentRundown
			}

			if (!isTransparentGroupMove) {
				// Remove the part from its original group.
				fromGroup.parts = fromGroup.parts.filter((p) => p.id !== part.id)
			}

			if (madeNewTransparentGroup) {
				// Add the new transparent group to the rundown.
				modifiedRundown.groups.splice(partMoveData.position, 0, toGroup)
			} else if (isTransparentGroupMove) {
				// Move the transparent group to its new position.
				modifiedRundown.groups = modifiedRundown.groups.filter((g) => toGroup && g.id !== toGroup.id)
				modifiedRundown.groups.splice(partMoveData.position, 0, toGroup)
			} else if (!isTransparentGroupMove) {
				// Add the part to its new group, in its new position.
				toGroup.parts.splice(partMoveData.position, 0, part)
			}

			// Clean up leftover empty transparent groups.
			if (fromGroup.transparent && fromGroup.parts.length <= 0) {
				modifiedRundown.groups = modifiedRundown.groups.filter((g) => g.id !== fromGroup.id)
			}

			return modifiedRundown
		}

		return currentRundown
	}, [currentRundown, partMoveData.fromGroupId, partMoveData.partId, partMoveData.position, partMoveData.toGroupId])
	useEffect(() => {
		if (partMoveData.moveId && partMoveData.done === true) {
			if (
				!currentRundownId ||
				!partMoveData.fromGroupId ||
				!partMoveData.partId ||
				typeof partMoveData.position !== 'number'
			) {
				return
			}

			setWaitingForMovePartUpdate(true)
			serverAPI
				.movePart({
					from: {
						rundownId: currentRundownId,
						groupId: partMoveData.fromGroupId,
						partId: partMoveData.partId,
					},
					to: {
						rundownId: currentRundownId,
						groupId: partMoveData.toGroupId,
						position: partMoveData.position,
					},
				})
				.catch((error) => {
					setWaitingForMovePartUpdate(false)
					handleError(error)
				})
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [partMoveData.moveId, partMoveData.done])
	useEffect(() => {
		if (waitingForMovePartUpdate) {
			return () => {
				setWaitingForMovePartUpdate(false)
				setPartMoveData({
					duplicate: null,
					partId: null,
					fromGroupId: null,
					toGroupId: null,
					position: null,
					moveId: null,
					done: null,
				})
			}
		}
	}, [waitingForMovePartUpdate, currentRundown])

	if (!project) {
		return <div>Loading...</div>
	}

	return (
		<HotkeyContext.Provider value={sorensen}>
			<GUIContext.Provider value={guiContextValue}>
				<IPCServerContext.Provider value={serverAPI}>
					<ProjectContext.Provider value={project}>
						<ResourcesContext.Provider value={resources}>
							<PartMoveContext.Provider value={partMoveContextValue}>
								<TimelineObjectMoveContext.Provider value={timelineObjectMoveContextValue}>
									<ErrorHandlerContext.Provider value={errorHandlerContextValue}>
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
														const nextRundown = openRundowns.find(
															(rd) => rd.rundownId !== rundownId
														)
														if (nextRundown) {
															setCurrentRundownId(nextRundown.rundownId)
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
														serverAPI
															.renameRundown({ rundownId, newName })
															.catch(handleError)
													}}
													onSettingsClick={() => {
														setSettingsOpen(true)
													}}
													bridgeStatuses={bridgeStatuses}
												/>
											</div>

											{modifiedCurrentRundown ? (
												<RundownContext.Provider value={modifiedCurrentRundown}>
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
									</ErrorHandlerContext.Provider>
								</TimelineObjectMoveContext.Provider>
							</PartMoveContext.Provider>
						</ResourcesContext.Provider>
					</ProjectContext.Provider>
				</IPCServerContext.Provider>
			</GUIContext.Provider>
		</HotkeyContext.Provider>
	)
}
