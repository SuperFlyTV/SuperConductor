import { app, BrowserWindow, Menu } from 'electron'
import isDev from 'electron-is-dev'
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
	win.loadURL(isDev ? 'http://localhost:9124' : `file://${app.getAppPath()}/index.html`).catch(console.error)

	const template: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = [
		{
			label: 'File',
			submenu: [
				{
					label: 'Save',
					click: () => alert('Hello!'),
				},
				{
					label: 'Load',
					click: () => alert('Hello!'),
				},
			],
		},
	]

	const _menu = Menu.buildFromTemplate(template)
	// Menu.setApplicationMenu(menu)

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
