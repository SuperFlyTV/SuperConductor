import { EverythingService } from '../EverythingService'
import { Application, Params } from '@feathersjs/feathers'
import EventEmitter from 'node:events'
import { ProjectsEvents, ServiceTypes } from '../../ipc/IPCAPI'
import { Project, ProjectBase } from '../../models/project/Project'
import { ClientEventBus } from '../ClientEventBus'
import { SerializableLedgers } from '../../models/project/Project'

export const PROJECTS_CHANNEL_PREFIX = 'projects'
export class ProjectService extends EventEmitter {
	constructor(
		private app: Application<ServiceTypes, any>,
		private everythingService: EverythingService,
		clientEventBus: ClientEventBus
	) {
		super()
		clientEventBus.on('updateProject', (project: Project) => {
			this.emit(ProjectsEvents.UPDATED, project)
		})
		clientEventBus.on('updateUndoLedgers', (ledgers: SerializableLedgers) => {
			this.emit(ProjectsEvents.UNDO_LEDGERS_UPDATED, ledgers)
		})
	}

	async get(_id: string): Promise<Project> {
		return this.everythingService.getProject()
	}

	async getAll(params: Params): Promise<ProjectBase[]> {
		// TODO: access control
		const projects = this.everythingService.listProjects()
		if (params.connection) {
			// TODO: this will include organizationId in the future
			this.app.channel(PROJECTS_CHANNEL_PREFIX).join(params.connection) // automatically subscribes to updates
		}
		return projects
	}

	async unsubscribe(params: Params): Promise<void> {
		if (params.connection) {
			// TODO: this will include organizationId in the future
			this.app.channel(PROJECTS_CHANNEL_PREFIX).leave(params.connection)
		}
	}

	async create(): Promise<ProjectBase> {
		// TODO: access control
		return await this.everythingService.newProject()
	}

	async update(id: string, project: Project): Promise<ProjectBase> {
		// TODO: access control
		return await this.everythingService.updateProject({ id, project })
	}

	async open(data: { projectId: string }): Promise<void> {
		// TODO: access control
		return await this.everythingService.openProject(data)
	}

	async export(): Promise<void> {
		// TODO: args - we need to know which project
		// TODO: access control
		return await this.everythingService.exportProject()
	}

	async import(): Promise<void> {
		// TODO: args - we want to get the whole project file opened by the client
		// TODO: access control
		return await this.everythingService.importProject()
	}

	async undo(data: { key: string }): Promise<void> {
		// TODO: likely not the best place for this method
		// TODO: access control
		return await this.everythingService.undo(data.key)
	}

	async redo(data: { key: string }): Promise<void> {
		// TODO: likely not the best place for this method
		// TODO: access control
		return await this.everythingService.redo(data.key)
	}
}
