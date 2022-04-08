import { getGroupPlayData, GroupPlayData } from '../../lib/playhead'
import { makeAutoObservable } from 'mobx'
import _ from 'lodash'
import { IPCClient } from '../api/IPCClient'
import { Rundown } from '../../models/rundown/Rundown'
const { ipcRenderer } = window.require('electron')

export class GroupPlayDataStore {
	groups: Map<string, GroupPlayData> = new Map()

	ipcClient = new IPCClient(ipcRenderer, {
		updateRundown: (_rundownId: string, rundown: Rundown) => {
			this.rundown = rundown
		},
	})

	private rundown: Rundown | undefined = undefined

	constructor() {
		makeAutoObservable(this)

		window.requestAnimationFrame(() => {
			this.updateGroupPlayData()
		})
	}

	private updateGroupPlayData() {
		if (this.rundown) {
			// Update the groups map with the latest groups from the rundown and fresh playhead data for them.
			for (const group of this.rundown.groups) {
				const newData = getGroupPlayData(group.preparedPlayData)
				if (!_.isEqual(newData, this.groups.get(group.id))) {
					this.groups.set(group.id, newData)
				}
			}

			// Go through the groups map and remove any groups which no longer exist in the rundown.
			for (const groupId in this.groups) {
				if (!(groupId in this.rundown.groups)) {
					this.groups.delete(groupId)
				}
			}
		}

		window.requestAnimationFrame(() => {
			this.updateGroupPlayData()
		})
	}
}
