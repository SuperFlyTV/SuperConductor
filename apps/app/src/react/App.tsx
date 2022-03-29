import React, { useEffect, useMemo, useState } from 'react'
const { ipcRenderer } = window.require('electron')

import '@fontsource/barlow/300.css'
import '@fontsource/barlow/400.css'
import '@fontsource/barlow/500.css'
import '@fontsource/barlow/700.css'
import '@fontsource/barlow-semi-condensed/600.css'
import '@fontsource/barlow-condensed/300.css'
import '@fontsource/barlow-condensed/400.css'
import '@fontsource/barlow-condensed/500.css'
import './styles/app.scss'
import { RundownView } from './components/rundown/RundownView'
import { Sidebar } from './components/sidebar/Sidebar'
import sorensen from '@sofie-automation/sorensen'
import { IPCClient } from './api/IPCClient'
import { IPCServer } from './api/IPCServer'
import { Project } from '../models/project/Project'
import { Rundown } from '../models/rundown/Rundown'
import { IPCServerContext } from './contexts/IPCServer'
import { ProjectContext } from './contexts/Project'
import { RundownContext } from './contexts/Rundown'
import { HotkeyContext, IHotkeyContext, TriggersEmitter } from './contexts/Hotkey'
import { TimelineObjectMove, TimelineObjectMoveContext } from './contexts/TimelineObjectMove'
import { useSnackbar } from 'notistack'
import { AppData } from '../models/App/AppData'
import { ErrorHandlerContext } from './contexts/ErrorHandler'
import { ActiveTrigger, ActiveTriggers } from '../models/rundown/Trigger'
import { deepClone } from '@shared/lib'
import { PartMove, PartMoveContext } from './contexts/PartMove'
import { Group } from '../models/rundown/Group'
import { getDefaultGroup } from '../electron/defaults'
import { allowMovingItemIntoGroup } from '../lib/util'
import short from 'short-uuid'
import { observer } from 'mobx-react-lite'
import { HeaderBar } from './components/headerBar/HeaderBar'
import { store } from './mobx/store'
import { HomePage } from './components/pages/homePage/HomePage'
import { NewRundownPage } from './components/pages/newRundownPage/NewRundownPage'

/**
 * Used to remove unnecessary cruft from error messages.
 */
const ErrorCruftRegex = /^Error invoking remote method '.+': /

export const App = observer(() => {
	const [project, setProject] = useState<Project>()
	const [waitingForMovePartUpdate, setWaitingForMovePartUpdate] = useState(false)
	const [sorensenInitialized, setSorensenInitialized] = useState(false)
	const { enqueueSnackbar } = useSnackbar()

	const rundownsStore = store.rundownsStore

	const triggers = useMemo(() => {
		return new TriggersEmitter()
	}, [])

	// Handle IPC-messages from server
	useEffect(() => {
		const ipcClient = new IPCClient(ipcRenderer, {
			updateAppData: (appData: AppData) => {
				store.appStore.update(appData)
				store.rundownsStore.update(appData.rundowns)
			},
			updateProject: (project: Project) => {
				setProject(project)
			},
			updatePeripheralTriggers: (peripheralTriggers: ActiveTriggers) => {
				triggers.setPeripheralTriggers(peripheralTriggers)
			},
		})

		return () => {
			ipcClient.destroy()
		}
	}, [triggers])

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

	// Handle hotkeys from keyboard:
	useEffect(() => {
		const handleKey = (e: KeyboardEvent) => {
			const isFunctionKey = e.code.match(/F\d\d?/)
			if (!isFunctionKey) {
				// Ignore keypresses when the user is typing in an input field:
				if (document.activeElement?.tagName === 'INPUT') return
			}

			const activeKeys = sorensen.getPressedKeys().map<ActiveTrigger>((code) => {
				return {
					fullIdentifier: `keyboard-${code}`,
					bridgeId: '',
					deviceId: `keyboard`,
					deviceName: '',
					identifier: sorensen.getKeyForCode(code),
				}
			})
			triggers.setActiveKeys(activeKeys)

			// Check if anyone is listening for keys.
			// In that case, the user is currently setting up new triggers, so we don't want to
			// send the keys to the backend and unexpectedly trigger the action.
			if (!triggers.isAnyoneListening()) {
				// Send the currently pressed keys to backend, so that the server can execute triggers:
				serverAPI.setKeyboardKeys(activeKeys).catch(handleError)
			}
		}
		document.addEventListener('keydown', (e) => handleKey(e))
		document.addEventListener('keyup', (e) => handleKey(e))
	}, [handleError, triggers, serverAPI])

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

	const gui = store.guiStore

	const handlePointerDownAnywhere: React.MouseEventHandler<HTMLDivElement> = (e) => {
		const tarEl = e.target as HTMLElement
		const isOnLayer = tarEl.closest('.object')
		const isOnSidebar = tarEl.closest('.side-bar')
		const isOnMUI = tarEl.closest('.MuiModal-root')

		if (!isOnMUI && !isOnLayer && !isOnSidebar && !timelineObjectMoveData.partId) {
			if (gui.selectedTimelineObjIds.length > 0) {
				gui.selectedTimelineObjIds = []
				gui.selectedGroupId = undefined
				gui.selectedPartId = undefined
			}
		}
	}

	useEffect(() => {
		sorensen
			.init()
			.then(() => {
				setSorensenInitialized(true)
			})
			.catch(console.error)
	}, [])

	const modifiedCurrentRundown = useMemo<Rundown | undefined>(() => {
		if (!rundownsStore.currentRundown) {
			return rundownsStore.currentRundown
		}

		const modifiedRundown = deepClone(rundownsStore.currentRundown)

		if (partMoveData.partId) {
			if (typeof partMoveData.position !== 'number') {
				return rundownsStore.currentRundown
			}

			const fromGroup = modifiedRundown.groups.find((g) => g.id === partMoveData.fromGroupId)

			if (!fromGroup) {
				return rundownsStore.currentRundown
			}

			const part = fromGroup.parts.find((p) => p.id === partMoveData.partId)

			if (!part) {
				return rundownsStore.currentRundown
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
				return rundownsStore.currentRundown
			}

			const allow = allowMovingItemIntoGroup(part.id, fromGroup, toGroup)

			if (!allow) {
				return rundownsStore.currentRundown
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

		return rundownsStore.currentRundown
	}, [
		rundownsStore.currentRundown,
		partMoveData.fromGroupId,
		partMoveData.partId,
		partMoveData.position,
		partMoveData.toGroupId,
	])

	useEffect(() => {
		if (partMoveData.moveId && partMoveData.done === true) {
			if (
				!store.rundownsStore.currentRundownId ||
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
						rundownId: store.rundownsStore.currentRundownId,
						groupId: partMoveData.fromGroupId,
						partId: partMoveData.partId,
					},
					to: {
						rundownId: store.rundownsStore.currentRundownId,
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
	}, [waitingForMovePartUpdate, rundownsStore.currentRundown])

	const hotkeyContext: IHotkeyContext = {
		sorensen,
		triggers,
	}

	if (!project || !sorensenInitialized) {
		return <div>Loading...</div>
	}

	return (
		<HotkeyContext.Provider value={hotkeyContext}>
			<IPCServerContext.Provider value={serverAPI}>
				<ProjectContext.Provider value={project}>
					<PartMoveContext.Provider value={partMoveContextValue}>
						<TimelineObjectMoveContext.Provider value={timelineObjectMoveContextValue}>
							<ErrorHandlerContext.Provider value={errorHandlerContextValue}>
								<div className="app" onPointerDown={handlePointerDownAnywhere}>
									<HeaderBar />

									{store.guiStore.isNewRundownSelected() ? (
										<NewRundownPage />
									) : store.guiStore.isHomeSelected() ? (
										<HomePage project={project} />
									) : (
										modifiedCurrentRundown && (
											<RundownContext.Provider value={modifiedCurrentRundown}>
												<div className="main-area">
													<RundownView mappings={project.mappings} />
												</div>
												<div className="side-bar">
													<div className="bokeh" />
													<Sidebar mappings={project.mappings} />
												</div>
											</RundownContext.Provider>
										)
									)}
								</div>
							</ErrorHandlerContext.Provider>
						</TimelineObjectMoveContext.Provider>
					</PartMoveContext.Provider>
				</ProjectContext.Provider>
			</IPCServerContext.Provider>
		</HotkeyContext.Provider>
	)
})
