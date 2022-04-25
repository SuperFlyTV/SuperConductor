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
import { DefiningArea } from 'src/lib/triggers/keyDisplay'
import { ConfirmationDialog } from './components/util/ConfirmationDialog'

/**
 * Used to remove unnecessary cruft from error messages.
 */
const ErrorCruftRegex = /^Error invoking remote method '.+': /

// Set this to true when debugging rendering:
const ENABLE_WHY_DID_YOU_RENDER = false

if (process.env.NODE_ENV === 'development' && ENABLE_WHY_DID_YOU_RENDER) {
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
				serverAPI.setKeyboardKeys({ activeKeys }).catch(handleError)
			}
		}
		document.addEventListener('keydown', (e) => handleKey(e))
		document.addEventListener('keyup', (e) => handleKey(e))
	}, [handleError, triggers, serverAPI])

	const gui = store.guiStore

	const handlePointerDownAnywhere: React.MouseEventHandler<HTMLDivElement> = (e) => {
		const tarEl = e.target as HTMLElement
		const isOnLayer = tarEl.closest('.object')
		const isOnSidebar = tarEl.closest('.side-bar')
		const isOnMUI = tarEl.closest('.MuiModal-root')

		if (!isOnMUI && !isOnLayer && !isOnSidebar && !gui.timelineObjMove.partId) {
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
			appStore.serverAPI.acknowledgeSeenVersion().catch(console.error)
		}
	}

	// Handle using the Delete key to delete timeline objs
	const currentRundownId = store.rundownsStore.currentRundownId
	const [showDeleteTimelineObjConfirmationDialog, setShowDeleteTimelineObjConfirmationDialog] = useState(false)
	const deleteSelectedTimelineObjs = useCallback(() => {
		if (!currentRundownId) {
			return
		}

		const promises: Promise<void>[] = []
		for (const id of gui.selectedTimelineObjIds) {
			const promise = serverAPI.deleteTimelineObj({
				rundownId: currentRundownId,
				timelineObjId: id,
			})
			promises.push(promise)
		}

		Promise.all(promises).catch(handleError)
	}, [currentRundownId, gui.selectedTimelineObjIds, handleError, serverAPI])
	useEffect(() => {
		if (!sorensenInitialized) {
			return
		}

		const onKey = async () => {
			try {
				if (!currentRundownId) {
					return
				}

				const pressed = sorensen.getPressedKeys()
				if (pressed.includes('Delete')) {
					console.log('pressed, currentRundownId:', currentRundownId)
					const selectedAndPlayingTimelineObjIds = await gui.getSelectedAndPlayingTimelineObjIds(
						currentRundownId
					)
					if (selectedAndPlayingTimelineObjIds.size > 0) {
						setShowDeleteTimelineObjConfirmationDialog(true)
					} else {
						deleteSelectedTimelineObjs()
					}
				}
			} catch (error) {
				handleError(error)
			}
		}
		onKey().catch(handleError)

		sorensen.bind('Delete', onKey, {
			up: false,
			global: true,
		})
		sorensen.bind('Delete', onKey, {
			up: true,
			global: true,
		})

		sorensen.addEventListener('keycancel', onKey)

		return () => {
			sorensen.unbind('Delete', onKey)
			sorensen.removeEventListener('keycancel', onKey)
		}
	}, [sorensenInitialized, handleError, gui, currentRundownId, deleteSelectedTimelineObjs])

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
					<ErrorHandlerContext.Provider value={errorHandlerContextValue}>
						<div className="app" onPointerDown={handlePointerDownAnywhere}>
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
								open={showDeleteTimelineObjConfirmationDialog}
								title="Delete Timeline Object(s)"
								body="Some of the selected timeline objects are currently being used in playout. Are you sure you wish to delete them?"
								acceptLabel="Delete"
								onDiscarded={() => {
									setShowDeleteTimelineObjConfirmationDialog(false)
								}}
								onAccepted={() => {
									deleteSelectedTimelineObjs()
									setShowDeleteTimelineObjConfirmationDialog(false)
								}}
							/>
						</div>
					</ErrorHandlerContext.Provider>
				</ProjectContext.Provider>
			</IPCServerContext.Provider>
		</HotkeyContext.Provider>
	)
})
