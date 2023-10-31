import { ElectronAPI } from '../../ipc/IPCAPI'

export const ElectronApi = (window as any).electronAPI ? ((window as any).electronAPI as ElectronAPI) : undefined
