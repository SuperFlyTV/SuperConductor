import { app, BrowserWindow, Menu } from 'electron'
import isDev from 'electron-is-dev'
import { TimedPlayerThingy } from './electron/TimedPlayerThingy'

const createWindow = (): void => {
	const tpt = new TimedPlayerThingy()

	console.log('tpt.windowPosition', tpt.windowPosition)
	let win = new BrowserWindow({
		y: tpt.windowPosition.y,
		x: tpt.windowPosition.x,
		width: tpt.windowPosition.width,
		height: tpt.windowPosition.height,

		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
	})

	// Hack to make it work on Windows with multi-dpi screens
	// Ref: https://github.com/electron/electron/pull/10972
	win.setBounds(tpt.windowPosition)

	tpt.initWindow(win)

	win.webContents.openDevTools()
	win.loadURL(isDev ? 'http://localhost:8080' : `file://${app.getAppPath()}/index.html`)

	const isMac = process.platform === 'darwin'

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

	const menu = Menu.buildFromTemplate(template)
	// Menu.setApplicationMenu(menu)

	app.on('window-all-closed', async () => {
		await tpt.saveAppData()
		app.quit()
	})

	// Listen to and update the size and position of the app, so that it starts in the same place next time:
	const updateSizeAndPosition = () => {
		const newBounds = win.getBounds()
		tpt.windowPosition.x = newBounds.x
		tpt.windowPosition.y = newBounds.y
		tpt.windowPosition.width = newBounds.width
		tpt.windowPosition.height = newBounds.height
	}
	win.on('resized', (event: any) => {
		updateSizeAndPosition()
	})
	win.on('moved', (event: any) => {
		updateSizeAndPosition()
	})
}

app.on('ready', createWindow)
