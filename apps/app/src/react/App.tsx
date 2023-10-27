import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
// const { ipcRenderer } = window.require('electron')

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
import { RealtimeDataProvider } from './api/RealtimeDataProvider'
import { ApiClient } from './api/ApiClient'
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
import { DefiningArea } from '../lib/triggers/keyDisplay/keyDisplay'
import { ConfirmationDialog } from './components/util/ConfirmationDialog'
import { LoggerContext } from './contexts/Logger'
import { ClientSideLogger } from './api/logger'
import { useMemoComputedObject, useMemoComputedValue } from './mobx/lib'
import { getAllActionsInParts, ActionAny, getAllApplicationActions } from '../lib/triggers/action'
import { assertNever, deepClone, stringifyErrorInner } from '@shared/lib'
import { setupClipboard } from './api/clipboard/clipboard'
import { ClipBoardContext } from './api/clipboard/lib'
import { UserAgreementScreen } from './components/UserAgreementScreen'
import { USER_AGREEMENT_VERSION } from '../lib/userAgreement'
import { DebugTestErrors } from './components/util/Debug'
import { ErrorBoundary } from './components/util/ErrorBoundary'
import { Spinner } from './components/util/Spinner'
import { CB } from './lib/errorHandling'
import { ActiveAnalog } from '../models/rundown/Analog'
import { SystemMessageOptions } from '../ipc/IPCAPI'
import { TextBtn } from './components/inputs/textBtn/TextBtn'
import { HiOutlineX, HiDotsVertical } from 'react-icons/hi'
import { protectString } from '@shared/models'
import { PERIPHERAL_KEYBOARD } from '../models/project/Peripheral'

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
	const { enqueueSnackbar, closeSnackbar } = useSnackbar()

	const serverAPI = useMemo<ApiClient>(() => {
		return new ApiClient()
	}, [])

	const logger = useMemo(() => {
		return new ClientSideLogger(serverAPI)
	}, [serverAPI])

	const triggers = useMemo(() => {
		return new TriggersEmitter()
	}, [])

	const handleError = useCallback(
		(...args: any[]) => {
			for (const error of args) {
				logger.error(args)
				const { message, stack } = stringifyErrorInner(error)

				if (message) {
					enqueueSnackbar(message.replace(ErrorCruftRegex, ''), { variant: 'error' })

					// Don't send sever-errors back to server:
					if (!message.match(ErrorCruftRegex)) {
						// eslint-disable-next-line no-console
						serverAPI.handleClientError({ error: message, stack }).catch(console.error)
					}
				}
			}
			return true
		},
		[enqueueSnackbar, logger, serverAPI]
	)

	// Handle IPC-messages from server
	useEffect(() => {
		const ipcClient = new RealtimeDataProvider(logger, {
			systemMessage: (messageStr: string, options: SystemMessageOptions) => {
				messageStr = messageStr.replace(/\n/g, '<br>')
				const message = (
					<>
						<div>
							<p dangerouslySetInnerHTML={{ __html: messageStr }}></p>
							<>
								{options.displayRestartButton && (
									<TextBtn
										onClick={() => {
											closeSnackbar(snackBarKey)
											serverAPI.installUpdate().catch(handleError)
										}}
										label="Restart and install"
									/>
								)}
							</>
						</div>
						{options.persist && (
							<button
								className="close-btn"
								onClick={() => {
									closeSnackbar(snackBarKey)
								}}
							>
								<HiOutlineX />
							</button>
						)}
					</>
				)
				const snackBarKey = enqueueSnackbar(message, {
					variant: options.variant ?? 'info',
					key: options.key,
					persist: options.persist,
				})
			},
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
			updatePeripheralAnalog: (fullIdentifier: string, analog: ActiveAnalog | null) => {
				if (analog) {
					store.analogStore.updateActiveAnalog(analog)
				}
				// triggers.setPeripheralTriggers(peripheralTriggers)
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
	}, [enqueueSnackbar, closeSnackbar, triggers, logger, handleError, serverAPI])

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

	useEffect(() => {
		window.addEventListener('error', handleError)
		window.addEventListener('unhandledrejection', handleError)
		window.addEventListener('uncaughtException', handleError)
		// @ts-expect-error hack
		window.handleError = handleError
		return () => {
			window.removeEventListener('error', handleError)
			window.removeEventListener('unhandledrejection', handleError)
			window.removeEventListener('uncaughtException', handleError)
			// @ts-expect-error hack
			window.handleError = undefined
		}
	}, [handleError])

	const debugKeyPresses = useRef(0)
	const debugKeyPressesLastTime = useRef(0)
	const [debugMode, setDebugMode] = useState(false)
	useEffect(() => {
		if (!sorensenInitialized) {
			return
		}

		// 10 keypresses in a quick succession triggers various errors.
		// This is used to test reporting of errors as telemetry.
		const onF12Key = () => {
			const timeSinceLast = Date.now() - debugKeyPressesLastTime.current
			if (timeSinceLast < 500) {
				debugKeyPresses.current++
				if (debugKeyPresses.current === 10) {
					serverAPI.debugThrowError({ type: 'sync' }).catch(handleError)
					serverAPI.debugThrowError({ type: 'async' }).catch(handleError)
					serverAPI.debugThrowError({ type: 'setTimeout' }).catch(handleError)

					setTimeout(() => {
						throw new Error('This is a client-side error in a setTimeout')
					}, 100)
					setTimeout(() => {
						handleError(new Error('This is an error sent into handleError'))
					}, 350)

					setTimeout(() => {
						setDebugMode(true)
					}, 1000)

					debugKeyPresses.current = 0
				}
			} else {
				debugKeyPresses.current = 0
			}

			debugKeyPressesLastTime.current = Date.now()
		}
		sorensen.bind('F12', onF12Key, {
			up: false,
			global: true,
			exclusive: true,
			preventDefaultPartials: false,
		})
		return () => {
			sorensen.unbind('F12', onF12Key)
		}
	}, [sorensenInitialized, handleError, serverAPI])

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
					bridgeId: protectString(''),
					deviceId: PERIPHERAL_KEYBOARD,
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
		document.addEventListener(
			'keydown',
			CB((e) => handleKey(e))
		)
		document.addEventListener(
			'keyup',
			CB((e) => handleKey(e))
		)
	}, [handleError, triggers, serverAPI])

	const gui = store.guiStore

	useMemoComputedValue(() => {
		// Report any changes to the selection to the backend,
		// to that actions are handled properly:
		serverAPI.updateGUISelection({ selection: gui.selected }).catch(handleError)
	}, [gui.selected])

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

	/* eslint-disable @typescript-eslint/unbound-method */
	useEffect(() => {
		sorensen
			.init()
			.then(() => {
				setSorensenInitialized(true)
			})
			.catch(logger.error)
	}, [logger.error, serverAPI])
	/* eslint-enable @typescript-eslint/unbound-method */

	const appStore = store.appStore

	// Handle splash screen & User agreement:
	const [splashScreenOpen, setSplashScreenOpen] = useState(false)
	const [userAgreementScreenOpen, setUserAgreementScreenOpen] = useState(false)
	/** Will be set to true after appStore.version has been set and initially checked*/
	const splashScreenInitial = useRef(false)
	useMemoComputedValue(() => {
		const appData = appStore.appData
		// Check upon startup if the splash screen should be displayed:
		if (appData && splashScreenInitial.current === false) {
			// The initial data has been set
			splashScreenInitial.current = true

			if (!appData.version.seenVersion || appData.version.seenVersion !== appData.version.currentVersion) {
				setSplashScreenOpen(true)
			}
			if (appData.userAgreement !== USER_AGREEMENT_VERSION) {
				setUserAgreementScreenOpen(true)
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [appStore])
	function onSplashScreenClose(remindMeLater: boolean): void {
		setSplashScreenOpen(false)
		if (!remindMeLater) {
			// eslint-disable-next-line @typescript-eslint/unbound-method
			appStore.serverAPI.acknowledgeSeenVersion().catch(logger.error)
		}
	}
	function onUserAgreement(agreementVersion: string): void {
		setUserAgreementScreenOpen(false)
		// eslint-disable-next-line @typescript-eslint/unbound-method
		appStore.serverAPI.acknowledgeUserAgreement({ agreementVersion }).catch(logger.error)
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

	useEffect(() => {
		if (!sorensenInitialized) {
			return
		}

		// Bind Escape key to clear any selected Groups, Parts or Timeline-objects:
		const onEscapeKey = (e: KeyboardEvent) => {
			try {
				if (!currentRundownId) return
				if (
					document.activeElement?.tagName === 'INPUT' ||
					document.activeElement?.classList.contains('MuiPaper-root') ||
					document.activeElement?.classList.contains('MuiDialog-container') ||
					document.activeElement?.classList.contains('MuiMenuItem-root')
				)
					return

				e.preventDefault()

				if (gui.selected.length === 0) {
					// do nothing
				} else if (gui.selected.length > 0) {
					gui.clearSelected()
				}
			} catch (error) {
				handleError(error)
			}
		}
		function onUndo(): void {
			setUserAgreementScreenOpen(false)
			// eslint-disable-next-line @typescript-eslint/unbound-method
			serverAPI.undo().catch(handleError)
		}
		function onRedo(): void {
			setUserAgreementScreenOpen(false)
			// eslint-disable-next-line @typescript-eslint/unbound-method
			serverAPI.redo().catch(handleError)
		}
		sorensen.bind('Escape', onEscapeKey, {
			up: false,
			global: true,
			exclusive: true,
			preventDefaultPartials: false,
		})
		sorensen.bind('Control+KeyZ', onUndo, {
			up: false,
			global: true,
		})
		sorensen.bind('Control+KeyY', onRedo, {
			up: false,
			global: true,
		})
		return () => {
			sorensen.unbind('Escape', onEscapeKey)
			sorensen.unbind('Control+KeyZ', onUndo)
			sorensen.unbind('Control+KeyY', onRedo)
		}
	}, [sorensenInitialized, handleError, gui, currentRundownId, serverAPI])

	useMemoComputedValue(() => {
		if (!project) return

		/** All Parts in all open rundowns */
		const allParts = store.rundownsStore.allPartsWithRefs

		const buttonActions = new Map<string, ActionAny[]>()
		for (const action of getAllActionsInParts(allParts, project, store.appStore.peripherals)) {
			for (const fullIdentifier of action.trigger.fullIdentifiers) {
				let newButtonAction = buttonActions.get(fullIdentifier)
				if (!newButtonAction) {
					newButtonAction = []
					buttonActions.set(fullIdentifier, newButtonAction)
				}
				newButtonAction.push({
					type: 'rundown',
					...action,
				})
			}
		}
		store.rundownsStore.updateRundownButtonActions(buttonActions)
	}, [project])
	useMemoComputedValue(() => {
		const appData = store.appStore.appData
		if (!appData) return

		/** All Parts in all open rundowns */
		const allParts = store.rundownsStore.allPartsWithRefs

		const buttonActions = new Map<string, ActionAny[]>()
		for (const action of getAllApplicationActions(gui.selected, allParts, appData)) {
			const joinedIdentifier = action.trigger.fullIdentifiers.join('+')
			let newButtonAction = buttonActions.get(joinedIdentifier)
			if (!newButtonAction) {
				newButtonAction = []
				buttonActions.set(joinedIdentifier, newButtonAction)
			}
			newButtonAction.push({
				type: 'application',
				...action,
			})
		}

		store.rundownsStore.updateProjectButtonActions(buttonActions)
	}, [])

	const clipBoardContext = useRef<ClipBoardContext>({
		handleError,
		project,
		serverAPI,
	})
	useEffect(() => {
		setupClipboard(clipBoardContext.current)
	}, [])
	useEffect(() => {
		clipBoardContext.current.project = project
	}, [project])

	const hotkeyContext: IHotkeyContext = useMemo(() => {
		return {
			triggers,
		}
	}, [triggers])
	const appDataVersion = useMemoComputedObject(
		() => {
			return deepClone(appStore.appData?.version)
		},
		[appStore],
		true
	)

	if (!project || !sorensenInitialized) {
		return (
			<div className="app-loading">
				<Spinner heavyOperation />
			</div>
		)
	}

	const handleClickResizer: React.MouseEventHandler<HTMLDivElement> = (e) => {
		const tarEl = e.target as HTMLElement
		if (tarEl.closest('.movable-separator')) {
			e.preventDefault()
			window.addEventListener('mousemove', resizeMainArea)
			window.addEventListener('mouseup', endResizeMainArea)
		}
	}

	return (
		<HotkeyContext.Provider value={hotkeyContext}>
			<LoggerContext.Provider value={logger}>
				<IPCServerContext.Provider value={serverAPI}>
					<ProjectContext.Provider value={project}>
						<ErrorHandlerContext.Provider value={errorHandlerContextValue}>
							<div className="app" onClick={handleClickAnywhere}>
								<ErrorBoundary>
									<HeaderBar />
								</ErrorBoundary>

								<ErrorBoundary>
									{
										// Splash screens:
										splashScreenOpen ? (
											<SplashScreen
												seenVersion={appDataVersion?.seenVersion}
												currentVersion={appDataVersion?.currentVersion}
												onClose={onSplashScreenClose}
											/>
										) : userAgreementScreenOpen ? (
											<UserAgreementScreen
												onAgree={(agreementVersion: string) => {
													onUserAgreement(agreementVersion)
												}}
												onDisagree={() => {
													window.close()
												}}
											/>
										) : null
									}
								</ErrorBoundary>

								{store.guiStore.isNewRundownSelected() ? (
									<ErrorBoundary>
										<NewRundownPage />
									</ErrorBoundary>
								) : store.guiStore.isHomeSelected() ? (
									<ErrorBoundary>
										<HomePage project={project} />
									</ErrorBoundary>
								) : (
									<div
										className="rundown-area"
										style={{
											gridTemplateColumns:
												store.guiStore.mainAreaWidth !== undefined
													? `${store.guiStore.mainAreaWidth * 100}vw 0.4rem 1fr`
													: undefined,
										}}
									>
										<div
											className="main-area"
											style={{
												minWidth:
													store.guiStore.mainAreaWidth !== undefined ? 'auto' : undefined,
											}}
										>
											<ErrorBoundary>
												<RundownView mappings={project.mappings} />
											</ErrorBoundary>
										</div>
										<div className="movable-separator">
											<div className="movable-separator-content" onMouseDown={handleClickResizer}>
												<div className="movable-separator-icon">
													<HiDotsVertical />
												</div>
											</div>
										</div>
										<div
											className="side-bar"
											style={{
												minWidth:
													store.guiStore.mainAreaWidth !== undefined ? 'auto' : undefined,
											}}
										>
											<ErrorBoundary>
												<Sidebar mappings={project.mappings} />
											</ErrorBoundary>
										</div>
									</div>
								)}
								<ErrorBoundary>
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
								</ErrorBoundary>

								<ErrorBoundary>{debugMode && <DebugTestErrors />}</ErrorBoundary>
							</div>
						</ErrorHandlerContext.Provider>
					</ProjectContext.Provider>
				</IPCServerContext.Provider>
			</LoggerContext.Provider>
		</HotkeyContext.Provider>
	)
})

function resizeMainArea(e: MouseEvent) {
	store.guiStore.mainAreaWidth = Math.max(0.01, Math.min(0.99, e.pageX / window.innerWidth))
}

function endResizeMainArea() {
	window.removeEventListener('mousemove', resizeMainArea)
	window.removeEventListener('mouseup', endResizeMainArea)
}
