import { app, BrowserWindow, Menu, shell } from 'electron'
import isDev from 'electron-is-dev'
import { autoUpdater } from 'electron-updater'
import { TimedPlayerThingy } from './electron/TimedPlayerThingy'

const isMac = process.platform === 'darwin'

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
		},
	})

	if (appData.windowPosition.x !== undefined) {
		// Hack to make it work on Windows with multi-dpi screens
		// Ref: https://github.com/electron/electron/pull/10972
		win.setBounds(appData.windowPosition)
	}

	tpt.initWindow(win)

	if (isDev) {
		win.webContents.openDevTools()
	}
	win.loadURL(isDev ? 'http://localhost:9124' : `file://${app.getAppPath()}/dist/index.html`).catch(console.error)

	autoUpdater.checkForUpdatesAndNotify().catch(console.error)

	const menuTemplate: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = []

	if (isMac) {
		// { role: 'appMenu' }
		menuTemplate.push({
			label: app.name,
			submenu: [
				{ role: 'about' },
				{ type: 'separator' },
				{
					label: 'Preferences',
					accelerator: 'Command+P',
					click: async () => {
						tpt.ipcClient?.openSettings()
					},
				},
				{ type: 'separator' },
				{ role: 'services' },
				{ type: 'separator' },
				{ role: 'hide' },
				{ role: 'hideOthers' },
				{ role: 'unhide' },
				{ type: 'separator' },
				{ role: 'quit' },
			],
		})
	}

	// { role: 'fileMenu' }
	menuTemplate.push({
		label: 'File',
		submenu: [{ role: isMac ? 'close' : 'quit' }],
	})

	// { role: 'editMenu' }
	menuTemplate.push({
		label: 'Edit',
		submenu: [
			...(isMac
				? []
				: [
						{
							label: 'Preferences',
							click: async () => {
								tpt.ipcClient?.openSettings()
							},
						},
				  ]),
			{ role: 'undo' },
			{ role: 'redo' },
			{ type: 'separator' },
			{ role: 'cut' },
			{ role: 'copy' },
			{ role: 'paste' },
			...(isMac
				? [
						{ role: 'pasteAndMatchStyle' as const },
						{ role: 'delete' as const },
						{ role: 'selectAll' as const },
						{ type: 'separator' as const },
						{
							label: 'Speech',
							submenu: [{ role: 'startSpeaking' as const }, { role: 'stopSpeaking' as const }],
						},
				  ]
				: [{ role: 'delete' as const }, { type: 'separator' as const }, { role: 'selectAll' as const }]),
		],
	})

	// { role: 'viewMenu' }
	menuTemplate.push({
		label: 'View',
		submenu: [
			{ role: 'reload' },
			{ role: 'forceReload' },
			{ role: 'toggleDevTools' },
			{ type: 'separator' },
			{ role: 'resetZoom' },
			{ role: 'zoomIn' },
			{ role: 'zoomOut' },
			{ type: 'separator' },
			{ role: 'togglefullscreen' },
		],
	})

	// { role: 'windowMenu' }
	menuTemplate.push({
		label: 'Window',
		submenu: [
			{ role: 'minimize' },
			{ role: 'zoom' },
			...(isMac
				? [
						{ type: 'separator' as const },
						{ role: 'front' as const },
						{ type: 'separator' as const },
						{ role: 'window' as const },
				  ]
				: [{ role: 'close' as const }]),
		],
	})

	menuTemplate.push({
		role: 'help',
		submenu: [
			{
				label: 'Documentation',
				click: async () => {
					await shell.openExternal('https://github.com/SuperFlyTV/SuperConductor')
				},
			},
			{
				label: 'Search Issues',
				click: async () => {
					await shell.openExternal('https://github.com/SuperFlyTV/SuperConductor/issues')
				},
			},
		],
	})

	const menu = Menu.buildFromTemplate(menuTemplate)
	Menu.setApplicationMenu(menu)

	app.on('window-all-closed', async () => {
		await tpt.storage.writeChangesNow()
		app.quit()
	})

	// Listen to and update the size and position of the app, so that it starts in the same place next time:
	const updateSizeAndPosition = () => {
		const newBounds = win.getBounds()

		const appData = tpt.storage.getAppData()

		appData.windowPosition.x = newBounds.x
		appData.windowPosition.y = newBounds.y
		appData.windowPosition.width = newBounds.width
		appData.windowPosition.height = newBounds.height

		tpt.storage.updateAppData(appData)
	}
	win.on('resized', () => {
		updateSizeAndPosition()
	})
	win.on('moved', () => {
		updateSizeAndPosition()
	})
}

app.on('ready', createWindow)
