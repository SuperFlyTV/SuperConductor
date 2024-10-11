import { ElectronAPI } from '../../ipc/IPCAPI.js'

export const ElectronApi = (window as any).electronAPI ? ((window as any).electronAPI as ElectronAPI) : undefined
