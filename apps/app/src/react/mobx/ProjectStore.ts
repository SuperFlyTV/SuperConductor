import { makeAutoObservable } from 'mobx'
import { Project } from '../../models/project/Project'
import { PeripheralArea } from '../../models/project/Peripheral'
import { BridgeId, PeripheralId } from '@shared/api'
import { protectString } from '@shared/models'
import { Bridge, BridgePeripheralSettings } from '../../models/project/Bridge'

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
		deviceNames: {},
		analogInputSettings: {},
	}

	public assignedAreas: {
		assignedToGroupId: string
		bridgeId: BridgeId
		deviceId: PeripheralId
		areaId: string
		area: PeripheralArea
	}[] = []

	public availableAreas: {
		bridgeId: BridgeId
		deviceId: PeripheralId
		areaId: string
		area: PeripheralArea
	}[] = []

	constructor() {
		makeAutoObservable(this)
	}

	update(project: Project): void {
		this.project = project

		this._updateAssignedAreas()
	}

	private _updateAssignedAreas() {
		this.assignedAreas = []
		this.availableAreas = []

		for (const [bridgeId0, bridge] of Object.entries<Bridge>(this.project.bridges)) {
			const bridgeId = protectString<BridgeId>(bridgeId0)

			for (const [deviceId0, peripheralSettings] of Object.entries<BridgePeripheralSettings>(
				bridge.clientSidePeripheralSettings
			)) {
				const deviceId = protectString<PeripheralId>(deviceId0)

				for (const [areaId, area] of Object.entries<PeripheralArea>(peripheralSettings.areas)) {
					this.availableAreas.push({
						bridgeId,
						deviceId,
						areaId,
						area,
					})

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
