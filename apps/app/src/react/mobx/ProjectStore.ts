import { makeAutoObservable } from 'mobx'
import { Bridge } from '../../models/project/Bridge'
import { Mappings } from 'timeline-state-resolver-types'
import { Project, Settings } from '../../models/project/Project'
import { PeripheralArea } from '../../models/project/Peripheral'

/**
 * Information about currently opened project.
 * Updates regularly from electron backend.
 */
export class ProjectStore {
	project: Project = {
		id: '',
		name: '',
		mappings: {},
		bridges: {},
		settings: {
			enableInternalBridge: false,
		},
	}

	public assignedAreas: {
		assignedToGroupId: string
		bridgeId: string
		deviceId: string
		areaId: string
		area: PeripheralArea
	}[] = []

	constructor() {
		makeAutoObservable(this)
	}

	update(project: Project) {
		this.project = project

		this._updateAssignedAreas()
	}

	private _updateAssignedAreas() {
		this.assignedAreas = []

		for (const [bridgeId, bridge] of Object.entries(this.project.bridges)) {
			for (const [deviceId, peripheralSettings] of Object.entries(bridge.peripheralSettings)) {
				for (const [areaId, area] of Object.entries(peripheralSettings.areas)) {
					if (area.assignedToGroupId) {
						this.assignedAreas.push({
							assignedToGroupId: area.assignedToGroupId,
							bridgeId,
							deviceId,
							areaId,
							area,
						})
					}
				}
			}
		}
	}
}
