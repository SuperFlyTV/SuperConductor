import path from 'path'
import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron'
import isDev from 'electron-is-dev'
import { createLogger } from './logging'
import * as server from './electron/server'
import { IPCClient } from './electron/IPCClient'

let isQuitting = false

// Keep a global reference to prevent garbage collection.
let tray: Tray

const createWindow = async (): Promise<void> => {
	const win = new BrowserWindow({
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
	})
	if (isDev) {
		win.webContents.openDevTools()
	}
	await win.loadURL(isDev ? 'http://localhost:9125' : `file://${app.getAppPath()}/dist/index.html`)

	const ipcClient = new IPCClient(win)
	const log = createLogger(ipcClient)
	server.init(log)

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
	tray.setToolTip('TSR-Bridge')

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
}

// autoUpdater.on('before-quit-for-update', () => {
// 	isQuitting = true
// })

app.on('before-quit', () => {
	isQuitting = true
	// eslint-disable-next-line no-console
	server.close().catch(console.error)
})

app.on('ready', () => {
	// eslint-disable-next-line no-console
	createWindow().catch(console.error)
})
