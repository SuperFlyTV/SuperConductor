import { prepareGroupPlayData } from '../lib/playout/preparedGroupPlayData'
import { Group } from '../models/rundown/Group'
import { GroupPreparedPlayData } from '../models/GUI/PreparedPlayhead'
import { TSRTimeline } from 'timeline-state-resolver-types'
import { StorageHandler } from './storageHandler'
import { BridgeHandler } from './bridgeHandler'
import { getTimelineForGroup } from '../lib/timeline'

const queuedUpdateTimelines = new Map<string, NodeJS.Timeout>()

export function updateTimeline(
	storage: StorageHandler,
	bridgeHandler: BridgeHandler,
	group: Group
): GroupPreparedPlayData | null {
	const prepared = prepareGroupPlayData(group)

	// Defer update, to allow for multiple updates to be batched together:
	const existingTimeout = queuedUpdateTimelines.get(group.id)
	if (existingTimeout) clearTimeout(existingTimeout)

	queuedUpdateTimelines.set(
		group.id,
		setTimeout(() => {
			const queued = queuedUpdateTimelines.get(group.id)
			if (!queued) return
			queuedUpdateTimelines.delete(group.id)

			const timeline = getTimelineForGroup(group, prepared, undefined) as TSRTimeline
			bridgeHandler.updateTimeline(group.id, timeline)

			const project = storage.getProject()
			bridgeHandler.updateMappings(project.mappings)
		}, 1)
	)

	return prepared || null
}
