import { getGroupPlayData, GroupPlayData } from '../../lib/playout/groupPlayData'
import { makeAutoObservable } from 'mobx'
import _ from 'lodash'
import { IPCClient } from '../api/IPCClient'
import { Rundown } from '../../models/rundown/Rundown'
import { IPCServer } from '../api/IPCServer'
import { ClientSideLogger } from '../api/logger'
const { ipcRenderer } = window.require('electron')

export class GroupPlayDataStore {
	groups: Map<string, GroupPlayData> = new Map()

	serverAPI: IPCServer
	logger: ClientSideLogger
	ipcClient: IPCClient
	private updateGroupPlayDataLowLatency: boolean
	private updateGroupPlayDataFrameCount: number

	/** All open rundowns. Not defined here, this should not be an observable */
	private rundowns: Map<string, Rundown>

	constructor() {
		this.serverAPI = new IPCServer(ipcRenderer)
		this.logger = new ClientSideLogger(this.serverAPI)
		this.ipcClient = new IPCClient(this.logger, ipcRenderer, {
			updateRundown: (rundownId: string, rundown: Rundown | null) => {
				if (rundown) {
					this.rundowns.set(rundownId, rundown)
				} else {
					// The rundown has been closed or removed:
					this.rundowns.delete(rundownId)
				}
				this.updateGroupPlayDataLowLatency = true
			},
		})
		makeAutoObservable(this)

		this.rundowns = new Map()
		this.updateGroupPlayDataLowLatency = true
		this.updateGroupPlayDataFrameCount = 0

		window.requestAnimationFrame(() => {
			this.updateGroupPlayData()
		})
	}

	private updateGroupPlayData() {
		this.updateGroupPlayDataFrameCount++
		if (this.updateGroupPlayDataLowLatency || this.updateGroupPlayDataFrameCount % 5 === 0) {
			this.updateGroupPlayDataLowLatency = false

			// Update the groups map with the latest groups from the rundowns and fresh playhead data for them.
			const now = Date.now()
			const existingGroupIds = new Set<string>()
			for (const rundown of this.rundowns.values()) {
				for (const group of rundown.groups) {
					existingGroupIds.add(group.id)

					const newData = getGroupPlayData(group.preparedPlayData, now)
					if (!_.isEqual(newData, this.groups.get(group.id))) {
						this.groups.set(group.id, newData)

						if (newData.anyPartIsPlaying) {
							this.updateGroupPlayDataLowLatency = true
						}
					}
				}
			}

			// Go through the groups map and remove any groups which no longer exist in any rundown.
			for (const groupId of Array.from(this.groups.keys())) {
				if (!existingGroupIds.has(groupId)) {
					this.groups.delete(groupId)
				}
			}
		}

		window.requestAnimationFrame(() => {
			this.updateGroupPlayData()
		})
	}
}
