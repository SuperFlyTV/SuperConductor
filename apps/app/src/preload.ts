import { contextBridge, ipcRenderer } from 'electron'
import { ElectronAPI } from './ipc/IPCAPI'

contextBridge.exposeInMainWorld('electronAPI', {
	updateUndoLedger: (key, data) => {
		ipcRenderer.send('updateUndoLedger', key, data)
	},
} satisfies ElectronAPI)
