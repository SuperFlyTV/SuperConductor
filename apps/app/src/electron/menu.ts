import { app, Menu, shell } from 'electron'
import winston from 'winston'

const isMac = process.platform === 'darwin'

export interface GenerateMenuArgs {
	undoLabel: string
	undoEnabled: boolean
	redoLabel: string
	redoEnabled: boolean
	onUndoClick: () => void
	onRedoClick: () => void
	onAboutClick: () => void
	onUpdateClick: () => void
}

export function generateMenu(
	{
		undoLabel,
		undoEnabled,
		redoLabel,
		redoEnabled,
		onUndoClick,
		onRedoClick,
		onAboutClick,
		onUpdateClick,
	}: GenerateMenuArgs,
	log: winston.Logger
): Electron.Menu {
	const menuTemplate: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = []

	if (isMac) {
		menuTemplate.push({
			label: app.name,
			submenu: [
				{ role: 'about' },
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

	menuTemplate.push({
		label: 'File',
		submenu: [{ role: isMac ? 'close' : 'quit' }],
	})

	menuTemplate.push({
		label: 'Edit',
		submenu: [
			{
				label: undoLabel,
				accelerator: 'CommandOrControl+Z',
				click: onUndoClick,
				enabled: undoEnabled,
			},
			{
				label: redoLabel,
				accelerator: 'CommandOrControl+Y',
				click: onRedoClick,
				enabled: redoEnabled,
			},
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
				click: () => {
					shell.openExternal('https://github.com/SuperFlyTV/SuperConductor').catch(log.error)
				},
			},
			{
				label: 'Search Issues',
				click: () => {
					shell.openExternal('https://github.com/SuperFlyTV/SuperConductor/issues').catch(log.error)
				},
			},
			{
				label: 'Check For Updates',
				click: onUpdateClick,
			},
			{
				label: 'About',
				click: onAboutClick,
			},
		],
	})

	return Menu.buildFromTemplate(menuTemplate)
}
