import { app, BrowserWindow, Menu } from 'electron'
import isDev from 'electron-is-dev'
import { TimedPlayerThingy } from './electron/TimedPlayerThingy'

const createWindow = (): void => {
	let win = new BrowserWindow({
		width: 1200,
		height: 600,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
	})

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

	const tpt = new TimedPlayerThingy(win)

	app.on('window-all-closed', async () => {
		await tpt.saveAppData()
		app.quit()
	})
}

app.on('ready', createWindow)
