import { getGroupPlayData, GroupPlayData } from '../../lib/playout/groupPlayData'
import { makeAutoObservable } from 'mobx'
import _ from 'lodash'
import { RealtimeDataProvider } from '../api/RealtimeDataProvider'
import { Rundown } from '../../models/rundown/Rundown'
import { ApiClient } from '../api/ApiClient'
import { ClientSideLogger } from '../api/logger'

export class GroupPlayDataStore {
	groups: Map<string, GroupPlayData> = new Map()

	serverAPI: ApiClient
	logger: ClientSideLogger
	ipcClient: RealtimeDataProvider
	private updateGroupPlayDataLowLatency: boolean
	private updateGroupPlayDataFrameCount: number

	private rundown: Rundown | undefined = undefined

	constructor() {
		this.serverAPI = new ApiClient()
		this.logger = new ClientSideLogger(this.serverAPI)
		this.ipcClient = new RealtimeDataProvider(this.logger, {
			updateRundown: (_rundownId: string, rundown: Rundown) => {
				this.rundown = rundown
				this.updateGroupPlayDataLowLatency = true
			},
		})
		makeAutoObservable(this)

		this.updateGroupPlayDataLowLatency = true
		this.updateGroupPlayDataFrameCount = 0

		window.requestAnimationFrame(() => {
			this.updateGroupPlayData()
		})
	}

	private updateGroupPlayData() {
		if (this.rundown) {
			this.updateGroupPlayDataFrameCount++
			if (this.updateGroupPlayDataLowLatency || this.updateGroupPlayDataFrameCount % 5 === 0) {
				this.updateGroupPlayDataLowLatency = false

				// Update the groups map with the latest groups from the rundown and fresh playhead data for them.
				const now = Date.now()
				for (const group of this.rundown.groups) {
					const newData = getGroupPlayData(group.preparedPlayData, now)
					if (!_.isEqual(newData, this.groups.get(group.id))) {
						this.groups.set(group.id, newData)

						if (newData.anyPartIsPlaying) {
							this.updateGroupPlayDataLowLatency = true
						}
					}
				}

				// Go through the groups map and remove any groups which no longer exist in the rundown.
				for (const groupId in this.groups) {
					if (!(groupId in this.rundown.groups)) {
						this.groups.delete(groupId)
					}
				}
			}
		}

		window.requestAnimationFrame(() => {
			this.updateGroupPlayData()
		})
	}
}
