import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { IPCServerContext } from './contexts/IPCServer'
import { ProjectContext } from './contexts/Project'
import { HotkeyContext, IHotkeyContext, TriggersEmitter } from './contexts/Hotkey'
import { useSnackbar } from 'notistack'
import { AppData } from '../models/App/AppData'
import { ErrorHandlerContext } from './contexts/ErrorHandler'
import { ActiveTrigger, ActiveTriggers } from '../models/rundown/Trigger'
import { observer } from 'mobx-react-lite'
import { HeaderBar } from './components/headerBar/HeaderBar'
import { store } from './mobx/store'
import { HomePage } from './components/pages/homePage/HomePage'
import { NewRundownPage } from './components/pages/newRundownPage/NewRundownPage'
import { SplashScreen } from './components/SplashScreen'
import { DefiningArea } from '../lib/triggers/keyDisplay'
import { ConfirmationDialog } from './components/util/ConfirmationDialog'
import { LoggerContext } from './contexts/Logger'
import { ClientSideLogger } from './api/logger'
import { useMemoComputedValue } from './mobx/lib'
import { Action, getAllActionsInParts } from '../lib/triggers/action'
import { PartWithRef } from '../lib/util'
import { assertNever } from '@shared/lib'

/**
 * Used to remove unnecessary cruft from error messages.
 */
const ErrorCruftRegex = /^Error invoking remote method '.+': /

// Set this to true when debugging rendering:
const ENABLE_WHY_DID_YOU_RENDER = false

if (process.env.NODE_ENV === 'development' && ENABLE_WHY_DID_YOU_RENDER) {
	// eslint-disable-next-line no-console
	console.log('Why-did-you-render-enabled')
	// eslint-disable-next-line @typescript-eslint/no-var-requires, node/no-unpublished-require
	const whyDidYouRender = require('@welldone-software/why-did-you-render')
	whyDidYouRender(React, {
		trackAllPureComponents: true,
	})
}

export const App = observer(function App() {
	const [project, setProject] = useState<Project>()
	const [sorensenInitialized, setSorensenInitialized] = useState(false)
	const { enqueueSnackbar } = useSnackbar()

	const serverAPI = useMemo<IPCServer>(() => {
		return new IPCServer(ipcRenderer)
	}, [])

	const logger = useMemo(() => {
		return new ClientSideLogger(serverAPI)
	}, [serverAPI])

	const triggers = useMemo(() => {
		return new TriggersEmitter()
	}, [])

	// Handle IPC-messages from server
	useEffect(() => {
		const ipcClient = new IPCClient(logger, ipcRenderer, {
			updateAppData: (appData: AppData) => {
				store.appStore.update(appData)
				store.rundownsStore.update(appData.rundowns)
			},
			updateProject: (project: Project) => {
				setProject(project)
				store.projectStore.update(project)
			},
			updatePeripheralTriggers: (peripheralTriggers: ActiveTriggers) => {
				triggers.setPeripheralTriggers(peripheralTriggers)
			},
			displayAboutDialog: () => {
				setSplashScreenOpen(true)
			},
			updateDefiningArea: (definingArea: DefiningArea | null) => {
				store.guiStore.updateDefiningArea(definingArea)
			},
		})

		return () => {
			ipcClient.destroy()
		}
	}, [triggers, logger])

	const handleError = useMemo(() => {
		return (error: unknown): void => {
			logger.error(error)
			if (typeof error === 'object' && error !== null && 'message' in error) {
				enqueueSnackbar((error as any).message.replace(ErrorCruftRegex, ''), { variant: 'error' })
			} else if (typeof error === 'string') {
				enqueueSnackbar(error.replace(ErrorCruftRegex, ''), { variant: 'error' })
			} else {
				enqueueSnackbar('Unknown error, see console for details.', { variant: 'error' })
			}
		}
	}, [enqueueSnackbar, logger])

	const errorHandlerContextValue = useMemo(() => {
		return {
			handleError,
		}
	}, [handleError])

	useEffect(() => {
		// Ask backend for the data once ready:
		serverAPI.triggerSendAll().catch(handleError)

		// @ts-expect-error hack:
		window.makeDevData = () => {
			serverAPI.makeDevData().catch(handleError)
		}
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
				serverAPI.setKeyboardKeys({ activeKeys }).catch(handleError)
			}
		}
		document.addEventListener('keydown', (e) => handleKey(e))
		document.addEventListener('keyup', (e) => handleKey(e))
	}, [handleError, triggers, serverAPI])

	const gui = store.guiStore

	const handleClickAnywhere: React.MouseEventHandler<HTMLDivElement> = (e) => {
		const tarEl = e.target as HTMLElement

		if (
			tarEl.closest('.main-area') &&
			!tarEl.closest('.group') &&
			!tarEl.closest('.part') &&
			!tarEl.closest('.timeline-object') &&
			!tarEl.closest('.side-bar') &&
			!tarEl.closest('.MuiModal-root') &&
			!tarEl.closest('button') &&
			!gui.timelineObjMove.moveType
		) {
			gui.clearSelected()
		}
	}

	useEffect(() => {
		sorensen
			.init()
			.then(() => {
				setSorensenInitialized(true)
			})
			.catch(logger.error)
	}, [logger.error, serverAPI])

	// Handle splash screen:
	const appStore = store.appStore
	const [splashScreenOpen, setSplashScreenOpen] = useState(false)
	/** Will be set to true after appStore.version has been set and initially checked*/
	const splashScreenInitial = useRef(false)
	useEffect(() => {
		// Check upon startup if the splash screen should be displayed:
		if (appStore.version && splashScreenInitial.current === false) {
			splashScreenInitial.current = true

			if (!appStore.version.seenVersion || appStore.version.seenVersion !== appStore.version.currentVersion) {
				setSplashScreenOpen(true)
			}
		}
	}, [appStore.version])
	function onSplashScreenClose(remindMeLater: boolean): void {
		setSplashScreenOpen(false)
		if (!remindMeLater) {
			appStore.serverAPI.acknowledgeSeenVersion().catch(logger.error)
		}
	}

	// Handle using the Delete key to delete timeline objs
	const currentRundownId = useMemoComputedValue(() => {
		return store.rundownsStore.currentRundownId
	}, [])
	const [showDeleteConfirmationDialog, setShowDeleteConfirmationDialog] = useState<string | undefined>(undefined)
	const deleteSelectedTimelineObjs = useCallback(() => {
		if (!currentRundownId) {
			return
		}

		const promises: Promise<void>[] = []
		const deletedGroups = new Set<string>()
		const deletedParts = new Set<string>()
		for (const select of gui.selected) {
			if (select.type === 'group') {
				deletedGroups.add(select.groupId)
				promises.push(
					serverAPI.deleteGroup({
						rundownId: currentRundownId,
						groupId: select.groupId,
					})
				)
			}
		}
		for (const select of gui.selected) {
			if (select.type === 'part') {
				if (!deletedGroups.has(select.groupId)) {
					deletedParts.add(select.partId)
					promises.push(
						serverAPI.deletePart({
							rundownId: currentRundownId,
							groupId: select.groupId,
							partId: select.partId,
						})
					)
				}
			}
		}
		for (const select of gui.selected) {
			if (select.type === 'timelineObj') {
				if (!deletedGroups.has(select.groupId) && !deletedParts.has(select.partId)) {
					promises.push(
						serverAPI.deleteTimelineObj({
							rundownId: currentRundownId,
							groupId: select.groupId,
							partId: select.partId,
							timelineObjId: select.timelineObjId,
						})
					)
				}
			}
		}

		Promise.all(promises)
			.then(() => {
				gui.clearSelected()
			})
			.catch(handleError)
	}, [currentRundownId, gui, handleError, serverAPI])
	useEffect(() => {
		if (!sorensenInitialized) {
			return
		}

		const onDeleteKey = (e: KeyboardEvent) => {
			try {
				if (!currentRundownId) return
				if (document.activeElement?.tagName === 'INPUT') return

				e.preventDefault()

				if (gui.selected.length === 0) {
					// do nothing
				} else if (gui.selected.length > 1) {
					let countGroups = 0
					let countParts = 0
					let countTimelineObjs = 0

					for (const select of gui.selected) {
						if (select.type === 'group') {
							countGroups++
						} else if (select.type === 'part') {
							countParts++
						} else if (select.type === 'timelineObj') {
							countTimelineObjs++
						} else {
							assertNever(select)
						}
					}
					const strs = []
					if (countGroups > 0) strs.push(`${countGroups} groups`)
					if (countParts > 0) strs.push(`${countParts} parts`)
					if (countTimelineObjs > 0) strs.push(`${countTimelineObjs} timeline objects`)

					setShowDeleteConfirmationDialog(strs.join(', '))
				} else {
					deleteSelectedTimelineObjs()
				}

				// gui.getSelectedAndPlayingTimelineObjIds(currentRundownId)
				// 	.then((selectedAndPlayingTimelineObjIds) => {
				// 		if (selectedAndPlayingTimelineObjIds.size > 0) {
				// 			setShowDeleteConfirmationDialog(true)
				// 		} else {

				// 		}
				// 	})
				// 	.catch(handleError)
			} catch (error) {
				handleError(error)
			}
		}

		sorensen.bind('Delete', onDeleteKey, {
			up: false,
			global: true,
			exclusive: true,
			preventDefaultPartials: false,
		})

		return () => {
			sorensen.unbind('Delete', onDeleteKey)
		}
	}, [sorensenInitialized, handleError, gui, currentRundownId, deleteSelectedTimelineObjs])

	useMemoComputedValue(() => {
		if (!project) return

		const newButtonActions = new Map<string, Action[]>()

		const allRundownIds = Object.keys(store.rundownsStore.rundowns ?? {})

		/** All Parts in all open rundowns */
		const allParts: PartWithRef[] = []
		for (const rundownId of allRundownIds) {
			if (!store.rundownsStore.hasRundown(rundownId)) continue
			const rundown = store.rundownsStore.getRundown(rundownId)
			for (const groupId of rundown.groupIds) {
				const group = store.rundownsStore.getGroupWithParts(groupId)
				for (const part of group.parts) {
					allParts.push({
						rundown,
						group,
						part,
					})
				}
			}
		}

		const allActions = getAllActionsInParts(allParts, project, store.appStore.peripherals)
		for (const action of allActions) {
			for (const fullIdentifier of action.trigger.fullIdentifiers) {
				let newButtonAction = newButtonActions.get(fullIdentifier)
				if (!newButtonAction) {
					newButtonAction = []
					newButtonActions.set(fullIdentifier, newButtonAction)
				}
				newButtonAction.push(action)
			}
		}

		store.rundownsStore.updateAllButtonActions(newButtonActions)
	}, [project])

	const hotkeyContext: IHotkeyContext = useMemo(() => {
		return {
			triggers,
		}
	}, [triggers])

	if (!project || !sorensenInitialized) {
		return <div>Loading...</div>
	}

	return (
		<HotkeyContext.Provider value={hotkeyContext}>
			<LoggerContext.Provider value={logger}>
				<IPCServerContext.Provider value={serverAPI}>
					<ProjectContext.Provider value={project}>
						<ErrorHandlerContext.Provider value={errorHandlerContextValue}>
							<div className="app" onClick={handleClickAnywhere}>
								<HeaderBar />

								{splashScreenOpen && (
									<SplashScreen
										seenVersion={appStore.version?.seenVersion}
										currentVersion={appStore.version?.currentVersion}
										onClose={onSplashScreenClose}
									/>
								)}

								{store.guiStore.isNewRundownSelected() ? (
									<NewRundownPage />
								) : store.guiStore.isHomeSelected() ? (
									<HomePage project={project} />
								) : (
									<>
										<div className="main-area">
											<RundownView mappings={project.mappings} />
										</div>
										<div className="side-bar">
											<Sidebar mappings={project.mappings} />
										</div>
									</>
								)}

								<ConfirmationDialog
									open={!!showDeleteConfirmationDialog}
									title="Delete"
									acceptLabel="Delete"
									onDiscarded={() => {
										setShowDeleteConfirmationDialog(undefined)
									}}
									onAccepted={() => {
										deleteSelectedTimelineObjs()
										setShowDeleteConfirmationDialog(undefined)
									}}
								>
									<p>Do you want to delete {showDeleteConfirmationDialog}?</p>
								</ConfirmationDialog>
							</div>
						</ErrorHandlerContext.Provider>
					</ProjectContext.Provider>
				</IPCServerContext.Provider>
			</LoggerContext.Provider>
		</HotkeyContext.Provider>
	)
})
