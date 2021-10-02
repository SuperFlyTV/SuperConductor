import { app, BrowserWindow } from 'electron'
import isDev from 'electron-is-dev'

const createWindow = (): void => {
	let win = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			nodeIntegration: true,
		},
	})

	win.loadURL(isDev ? 'http://localhost:8080' : `file://${app.getAppPath()}/index.html`)
}

app.on('ready', createWindow)
