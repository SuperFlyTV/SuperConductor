import { makeAutoObservable } from 'mobx'
import { Bridge } from '../../models/project/Bridge'
import { Mappings } from 'timeline-state-resolver-types'
import { Project, Settings } from '../../models/project/Project'

/**
 * Information about currently opened project.
 * Updates regularly from electron backend.
 */
export class ProjectStore {
	id: string
	name: string

	mappings: Mappings
	bridges: {
		[bridgeId: string]: Bridge
	}

	settings: Settings

	constructor(init: Project) {
		makeAutoObservable(this)

		this.id = init.id
		this.name = init.name
		this.mappings = init.mappings
		this.bridges = init.bridges
		this.settings = init.settings
	}

	update(data: Project) {
		this.id = data.id
		this.name = data.name
		this.mappings = data.mappings
		this.bridges = data.bridges
		this.settings = data.settings
	}

	toPlain(): Project {
		return { id: this.id, name: this.name, mappings: this.mappings, bridges: this.bridges, settings: this.settings }
	}
}
