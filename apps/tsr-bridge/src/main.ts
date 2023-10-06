import path from 'path'
import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, screen } from 'electron'
import isDev from 'electron-is-dev'
import { addLoggerTransport, createLogger } from './logging'
import { CURRENT_VERSION, TSRBridgeServer } from './electron/server'
import { IPCClient } from './electron/IPCClient'
import { StorageHandler } from './electron/storageHandler'
import { IPCServer } from './electron/IPCServer'
import { AppData, AppSettings, AppSystem } from './models/AppData'
import os from 'os'

let isQuitting = false

const APP_NAME = 'SuperConductor TSR-Bridge'

// Keep a global reference to prevent garbage collection.
let tray: Tray

const log = createLogger()

const storage = new StorageHandler(log, {
	// Default window position:
	y: undefined,
	x: undefined,
	width: 600,
	height: 400,
	maximized: false,
})
let server: TSRBridgeServer | undefined
let systemInterval: NodeJS.Timer | undefined

const createWindow = async (): Promise<void> => {
	const appData = storage.getAppData()

	const win = new BrowserWindow({
		y: appData.windowPosition.y,
		x: appData.windowPosition.x,
		width: appData.windowPosition.width,
		height: appData.windowPosition.height,

		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
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
	if (isDev) {
		win.webContents.openDevTools()
	}

	const ipcClient = new IPCClient(win)
	addLoggerTransport(log, ipcClient)
	const _ipcServer = new IPCServer(ipcMain, log, storage, {
		initialized: () => {
			// Initial send:
			ipcClient.settings(storage.getAppData().settings)
			updateSystem()
		},
	})

	await win.loadURL(isDev ? 'http://localhost:9125' : `file://${app.getAppPath()}/dist/index.html`)

	storage.on('appData', (appData: AppData) => {
		ipcClient.settings(appData.settings)
		updateSystem()
		onUpdatedSettings(appData.settings)
	})

	const assetsPath = app.isPackaged
		? path.join(process.resourcesPath, 'assets')
		: path.resolve(app.getAppPath(), '../assets')
	const trayIconPath = path.join(assetsPath, process.platform == 'darwin' ? 'trayTemplate.png' : 'tray.png')
	tray = new Tray(nativeImage.createFromPath(trayIconPath))
	tray.setIgnoreDoubleClickEvents(true)
	tray.on('click', () => {
		win.show()
	})

	const trayContextMenu = Menu.buildFromTemplate([
		{
			label: 'Show App',
			click: () => {
				win.show()
			},
		},
		{
			label: 'Quit',
			click: () => {
				isQuitting = true
				app.quit()
			},
		},
	])
	tray.setContextMenu(trayContextMenu)
	tray.setToolTip(APP_NAME)

	// Listen to and update the size and position of the app, so that it starts in the same place next time:
	const updateSizeAndPosition = () => {
		const newBounds = win.getBounds()

		const appData = storage.getAppData()

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

		storage.updateAppData(appData)
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

	/**
	 * Autoupdate is disabled because electron-builder doesn't support
	 * two apps in one repo.
	 */
	// autoUpdater.checkForUpdatesAndNotify().catch(log.error)

	win.on('close', (event) => {
		if (!isQuitting) {
			event.preventDefault()
			win.hide()
			event.returnValue = false
		}
	})
	function updateSystem() {
		const networkAddresses: string[] = []
		Object.values<os.NetworkInterfaceInfo[] | undefined>(os.networkInterfaces()).forEach((nis) =>
			nis?.forEach((ni) => {
				const a = `${ni.address}`
				if (!a.match(/127.0.0.1/) && !a.match(/::1/)) {
					networkAddresses.push(ni.address)
				}
			})
		)

		const system: AppSystem = {
			networkAddresses: networkAddresses,
		}
		ipcClient.system(system)
	}

	systemInterval = setInterval(() => {
		updateSystem()
	}, 10000)

	const prevSettings: Partial<AppSettings> = {}
	function onUpdatedSettings(settings: AppSettings) {
		const autostart = Boolean(settings.autostart)
		if (prevSettings.autostart !== autostart) {
			prevSettings.autostart = autostart

			const loginItemSettings = app.getLoginItemSettings()

			if (loginItemSettings.openAtLogin !== autostart) {
				log.info(`Setting open at login to ${autostart}`)
				app.setLoginItemSettings({
					openAtLogin: autostart,
				})
			}
		}
	}

	log.info('TSR-Bridge current version:', CURRENT_VERSION)

	if (!server) {
		server = new TSRBridgeServer(log, storage)
		server.init()
	}
}

// autoUpdater.on('before-quit-for-update', () => {
// 	isQuitting = true
// })

app.on('before-quit', () => {
	isQuitting = true

	if (isQuitting) {
		log.info('Shutting down...')
		if (systemInterval) clearInterval(systemInterval)
		Promise.resolve()
			.then(async () => {
				await server?.terminate()
			})
			.catch(log.error)
	}
})

app.on('ready', () => {
	// eslint-disable-next-line no-console
	createWindow().catch(log.error)
})
