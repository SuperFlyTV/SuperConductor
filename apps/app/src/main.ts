import { literal, stringifyError } from '@shared/lib'
import { app, BrowserWindow, dialog, Menu, shell, screen, ipcMain } from 'electron'
import isDev from 'electron-is-dev'
import { autoUpdater } from 'electron-updater'
import { CURRENT_VERSION } from './electron/bridgeHandler'
import { generateMenu, GenerateMenuArgs } from './electron/menu'
import { SuperConductor } from './electron/SuperConductor'
import { createLoggers } from './lib/logging'
import { baseFolder } from './lib/baseFolder'
import path from 'path'
import winston from 'winston'
import { SerializableLedger } from './models/project/Project'

function createWindow(log: winston.Logger, superConductor: SuperConductor): void {
	const appData = superConductor.storage.getAppData()

	const win = new BrowserWindow({
		y: appData.windowPosition.y,
		x: appData.windowPosition.x,
		width: appData.windowPosition.width,
		height: appData.windowPosition.height,

		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			preload: path.join(__dirname, 'preload.js'),
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
	const handler = superConductor.onNewWindow(win)
	win.on('closed', () => {
		handler.close()
	})

	if (isDev) {
		// Disabled until https://github.com/MarshallOfSound/electron-devtools-installer/issues/215 is fixed
		// installExtension(REACT_DEVELOPER_TOOLS)
		// 	.then((name) => log.info(`Added Extension:  ${name}`))
		// 	.then(() => installExtension(MOBX_DEVTOOLS))
		// 	.then((name) => log.info(`Added Extension:  ${name}`))
		// 	.then(() => win.webContents.openDevTools())
		// 	.catch((err) => log.info('An error occurred: ', err))
		win.webContents.openDevTools()
	}
	win.loadURL(isDev ? 'http://127.0.0.1:9124' : `file://${app.getAppPath()}/dist/index.html`).catch(log.error)

	const menuOpts = literal<GenerateMenuArgs>({
		undoLabel: 'Undo',
		undoEnabled: false,
		redoLabel: 'Redo',
		redoEnabled: false,
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		onUndoClick: () => {},
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		onRedoClick: () => {},
		onAboutClick: () => {
			// TODO: this should probably become a client-side only action
			// handler.ipcClient.displayAboutDialog()
		},
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
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
				} else {
					await dialog.showMessageBox(win, {
						type: 'info',
						title: 'New version available',
						message: `A new version (${result.updateInfo.version}) will download automatically.`,
					})
				}
			} catch (error) {
				log.error(error)
			}
		},
	})
	const menu = generateMenu(menuOpts, log)
	Menu.setApplicationMenu(menu)

	ipcMain.on('updateUndoLedger', (_event, key: string, undoLedger: SerializableLedger) => {
		menuOpts.undoLabel = undoLedger.undo ? `Undo ${undoLedger.undo.description}` : 'Undo'
		menuOpts.undoEnabled = Boolean(undoLedger.undo)
		menuOpts.onUndoClick = () => {
			superConductor.ipcServer.undo(key).catch(log.error)
		}
		menuOpts.redoLabel = undoLedger.redo ? `Redo ${undoLedger.redo.description}` : 'Redo'
		menuOpts.redoEnabled = Boolean(undoLedger.redo)
		menuOpts.onRedoClick = () => {
			superConductor.ipcServer.redo(key).catch(log.error)
		}
		const menu = generateMenu(menuOpts, log)
		Menu.setApplicationMenu(menu)
	})
	// Listen to and update the size and position of the app, so that it starts in the same place next time:
	const updateSizeAndPosition = () => {
		const newBounds = win.getBounds()

		const appData = superConductor.storage.getAppData()

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

		superConductor.storage.updateAppData(appData)
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
		shell.openExternal(url).catch(log.error)

		return { action: 'deny' } // preventDefault
	})
	win.webContents.on('did-create-window', (childWindow) => {
		childWindow.webContents.on('will-navigate', (e) => {
			e.preventDefault()
		})
	})
}

function onAppReady(): void {
	const { electronLogger: log, rendererLogger } = createLoggers(path.join(baseFolder(), 'Logs'))

	log.info('Starting up...')

	const superConductor = new SuperConductor(log, rendererLogger)

	autoUpdater.on('update-available', (info) => {
		// Notify:

		if (autoUpdater.autoDownload) {
			superConductor.sendSystemMessage(
				`A new version (${info.version}) is available. It will automatically be downloaded and installed next time you restart SuperConductor.`,
				{
					key: 'update-available',
				}
			)
		} else {
			superConductor.sendSystemMessage(`A new version (${info.version}) is available.`, {
				key: 'update-available',
			})
		}
	})
	autoUpdater.on('update-downloaded', (info) => {
		superConductor.sendSystemMessage(
			`A new version (${info.version}) has been downloaded. Restart SuperConductor to install it.`,
			{
				key: 'update-downloaded',
				persist: true,
				displayRestartButton: true,
			}
		)
	})
	autoUpdater.on('error', (error, message) => {
		const errString = stringifyError(error) + message ? ` ${message}` : ''

		// Ignore, this is an error that pops up if the latest tag doesn't have a release yet (or if there a draft release):
		if (errString.match(/Cannot find latest.yml in the latest release artifacts/)) return
		log.error(errString)

		superConductor.sendSystemMessage(
			`There was an error when auto-updating, please <a href="https://github.com/SuperFlyTV/SuperConductor/releases/latest" target="_blank">download the latest</a> version manually.\nError message: ${stringifyError(
				error,
				true
			)}`,
			{
				variant: 'error',
				key: 'update-error',
			}
		)
	})
	superConductor.setAutoUpdateAllowPrerelease(true)

	app.on('window-all-closed', () => {
		// On macOS it is common for applications and their menu bar
		// to stay active until the user quits explicitly with Cmd + Q
		if (process.platform !== 'darwin') {
			// will close all the windows and then emit the 'will-quit' event:
			app.quit()
		}
	})
	app.on('will-quit', (event) => {
		event.preventDefault()
		shutDownApplication()
	})
	app.on('activate', () => {
		// This happens on macOS when user re-opens a window
		if (BrowserWindow.getAllWindows().length === 0) createWindow(log, superConductor)
	})

	const shutDownApplication = () => {
		log.info('Shutting down...')
		Promise.resolve()
			.then(() => {
				superConductor.isShuttingDown()
			})
			.then(async () => {
				await Promise.race([
					Promise.all([
						// Write any changes to disk:
						superConductor.storage.writeChangesNow(),
					]),
					// Add a timeout, in case the above doesn't finish:
					new Promise((resolve) => setTimeout(resolve, 1000)),
				])
			})

			.then(async () => {
				await Promise.race([
					Promise.all([
						// Gracefully shut down the internal TSR-Bridge:
						superConductor.bridgeHandler?.onClose(),
					]),
					// Add a timeout, in case the above doesn't finish:
					new Promise((resolve) => setTimeout(resolve, 1000)),
				])
			})
			.then(() => {
				superConductor.terminate()
				log.info('Shut down successfully.')
			})
			.catch((err) => {
				log.error(err)
			})
			.finally(() => {
				// Wait for the logger to finish writing logs:

				log.on('error', (_err) => {
					// Supress error
					// eslint-disable-next-line no-console
					console.error(_err)
				})
				log.on('finish', () => {
					// eslint-disable-next-line no-process-exit
					process.exit(0)
					// app.quit()
				})
				log.end()
			})
	}
	// Create the
	createWindow(log, superConductor)
}

app.on('ready', onAppReady)
