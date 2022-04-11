import { literal } from '@shared/lib'
import { app, BrowserWindow, dialog, Menu, shell, screen } from 'electron'
import isDev from 'electron-is-dev'
import { autoUpdater } from 'electron-updater'
// import installExtension, { REACT_DEVELOPER_TOOLS, MOBX_DEVTOOLS } from 'electron-devtools-installer'
import { CURRENT_VERSION } from './electron/bridgeHandler'
import { generateMenu, GenerateMenuArgs } from './electron/menu'
import { TimedPlayerThingy } from './electron/TimedPlayerThingy'

const createWindow = (): void => {
	const tpt = new TimedPlayerThingy()

	const appData = tpt.storage.getAppData()

	const win = new BrowserWindow({
		y: appData.windowPosition.y,
		x: appData.windowPosition.x,
		width: appData.windowPosition.width,
		height: appData.windowPosition.height,

		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			nativeWindowOpen: false,
		},
		title: 'SuperConductor',
	})

	if (appData.windowPosition.x !== undefined) {
		// Hack to make it work on Windows with multi-dpi screens
		// Ref: https://github.com/electron/electron/pull/10972
		const bestDisplay = screen.getDisplayMatching(appData.windowPosition)
		const windowBounds = {
			x: Math.max(appData.windowPosition.x, bestDisplay.workArea.x),
			y: Math.max(appData.windowPosition.y, bestDisplay.workArea.y),
			width: Math.min(appData.windowPosition.width, bestDisplay.workArea.width),
			height: Math.min(appData.windowPosition.height, bestDisplay.workArea.height),
		}
		win.setBounds(windowBounds)
	}

	if (appData.windowPosition.maximized) {
		win.maximize()
	}

	tpt.initWindow(win)

	if (isDev) {
		// Disabled until https://github.com/MarshallOfSound/electron-devtools-installer/issues/215 is fixed
		// installExtension(REACT_DEVELOPER_TOOLS)
		// 	.then((name) => console.log(`Added Extension:  ${name}`))
		// 	.then(() => installExtension(MOBX_DEVTOOLS))
		// 	.then((name) => console.log(`Added Extension:  ${name}`))
		// 	.then(() => win.webContents.openDevTools())
		// 	.catch((err) => console.log('An error occurred: ', err))
		win.webContents.openDevTools()
	}
	win.loadURL(isDev ? 'http://localhost:9124' : `file://${app.getAppPath()}/dist/index.html`).catch(console.error)

	autoUpdater.checkForUpdatesAndNotify().catch(console.error)

	const menuOpts = literal<GenerateMenuArgs>({
		undoLabel: 'Undo',
		undoEnabled: false,
		redoLabel: 'Redo',
		redoEnabled: false,
		onUndoClick: () => {
			return tpt.ipcServer?.undo().catch(console.error)
		},
		onRedoClick: () => {
			return tpt.ipcServer?.redo().catch(console.error)
		},
		onAboutClick: () => {
			tpt.ipcClient?.displayAboutDialog()
		},
		onUpdateClick: async () => {
			try {
				const result = await autoUpdater.checkForUpdatesAndNotify()
				if (!result) {
					if (!app.isPackaged) {
						await dialog.showMessageBox(win, {
							type: 'error',
							title: 'Error',
							message: `Can't check updates when running in development mode.`,
						})
					} else {
						await dialog.showMessageBox(win, {
							type: 'error',
							title: 'Error',
							message: `There was an error when checking for the latest version of SuperConductor. Please try again later.`,
						})
					}
				} else if (result.updateInfo && result.updateInfo.version === CURRENT_VERSION) {
					await dialog.showMessageBox(win, {
						type: 'info',
						title: 'Up-to-date',
						message: `You have the latest version of SuperConductor (v${CURRENT_VERSION}).`,
					})
				}
			} catch (error) {
				console.error(error)
			}
		},
	})
	const menu = generateMenu(menuOpts)
	Menu.setApplicationMenu(menu)

	tpt.ipcServer?.on('updatedUndoLedger', (undoLedger, undoPointer) => {
		const undoAction = undoLedger[undoPointer]
		const redoAction = undoLedger[undoPointer + 1]
		menuOpts.undoLabel = undoAction ? `Undo ${undoAction.description}` : 'Undo'
		menuOpts.undoEnabled = Boolean(undoAction)
		menuOpts.redoLabel = redoAction ? `Redo ${redoAction.description}` : 'Redo'
		menuOpts.redoEnabled = Boolean(redoAction)
		const menu = generateMenu(menuOpts)
		Menu.setApplicationMenu(menu)
	})

	app.on('window-all-closed', () => {
		Promise.resolve()
			.then(async () => {
				await Promise.race([
					Promise.all([
						// Write any changes to disk:
						tpt.storage.writeChangesNow(),
						// Gracefully shut down the internal TSR-Bridge:
						tpt.bridgeHandler?.onClose(),
					]),
					// Add a timeout, in case the above doesn't finish:
					new Promise((resolve) => setTimeout(resolve, 1000)),
				])
				app.quit()
			})
			.catch((err) => {
				console.error(err)
				app.quit()
			})
	})

	// Listen to and update the size and position of the app, so that it starts in the same place next time:
	const updateSizeAndPosition = () => {
		const newBounds = win.getBounds()

		const appData = tpt.storage.getAppData()

		const maximized = win.isMaximized()
		if (maximized) {
			// don't overwrite the X, Y, Width, Height, so that we can return to this size and position, once the
			// user unmaximizes
			appData.windowPosition.maximized = maximized
		} else {
			appData.windowPosition.x = newBounds.x
			appData.windowPosition.y = newBounds.y
			appData.windowPosition.width = newBounds.width
			appData.windowPosition.height = newBounds.height
			appData.windowPosition.maximized = maximized
		}

		tpt.storage.updateAppData(appData)
	}
	win.on('resized', () => {
		updateSizeAndPosition()
	})
	win.on('moved', () => {
		updateSizeAndPosition()
	})
	win.on('maximize', () => {
		updateSizeAndPosition()
	})
	win.on('unmaximize', () => {
		updateSizeAndPosition()
	})

	// Handle links <a target='_blank'>, to open in an external browser:
	win.webContents.setWindowOpenHandler(({ url }) => {
		// List urls which are OK to open in an Electron window:
		// if (url.startsWith('https://github.com/')) return { action: 'allow' }
		// if (url.startsWith('https://superfly.tv/')) return { action: 'allow' }

		// open url in a browser and prevent default
		shell.openExternal(url).catch(console.error)

		return { action: 'deny' } // preventDefault
	})
	win.webContents.on('did-create-window', (childWindow) => {
		childWindow.webContents.on('will-navigate', (e) => {
			e.preventDefault()
		})
	})
}

app.on('ready', createWindow)
