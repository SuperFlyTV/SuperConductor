import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI } from './ipc/IPCAPI.js'

contextBridge.exposeInMainWorld('electronAPI', {
	updateUndoLedger: (key, data) => {
		ipcRenderer.send('updateUndoLedger', key, data)
	},
} satisfies ElectronAPI)
