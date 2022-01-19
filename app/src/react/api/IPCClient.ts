import { IPCClientMethods } from '@/ipc/IPCAPI'
import { BridgeStatus } from '@/models/project/Bridge'
import { Project } from '@/models/project/Project'
import { ResourceAny } from '@/models/resource/resource'
import { Rundown } from '@/models/rundown/Rundown'
import { Mapping } from 'timeline-state-resolver-types'
import { Resources } from '../contexts/Resources'

/** This class is used client-side, to handle messages from the server */
export class IPCClient implements IPCClientMethods {
	constructor(
		private ipcRenderer: Electron.IpcRenderer,
		private callbacks: {
			updateProject: (project: Project) => void
			updateRundown: (fileName: string, rundown: Rundown) => void
			updateResource: (id: string, resource: ResourceAny | null) => void
			updateBridgeStatus: (id: string, status: BridgeStatus | null) => void
			updateMapping: (id: string, mapping: Mapping | null) => void
		}
	) {
		this.ipcRenderer.on('callMethod', (event, methodname: string, ...args: any[]) => {
			const fcn = (this as any)[methodname]
			if (!fcn) {
				console.error(`IPCClient: method ${methodname} not found`)
			} else {
				fcn.apply(this, args)
			}
		})
	}

	updateProject(project: Project): void {
		this.callbacks.updateProject(project)
	}
	updateRundown(fileName: string, rundown: Rundown): void {
		this.callbacks.updateRundown(fileName, rundown)
	}
	updateResource(id: string, resource: ResourceAny | null): void {
		this.callbacks.updateResource(id, resource)
	}
	updateBridgeStatus(id: string, resource: BridgeStatus | null): void {
		this.callbacks.updateBridgeStatus(id, resource)
	}
	updateMapping(id: string, mapping: Mapping | null): void {
		this.callbacks.updateMapping(id, mapping)
	}
}
