import { KeyDisplayTimeline, AttentionLevel } from '@shared/api'
import { Action } from './action'
import { getGroupPlayData, GroupPlayData } from '../../lib/playhead'
import { StorageHandler } from '../storageHandler'

export function idleKeyDisplay(_storage: StorageHandler): KeyDisplayTimeline {
	return [
		{
			id: 'idle_not_assigned',
			enable: { while: 1 },
			content: {
				attentionLevel: AttentionLevel.IGNORE,
			},
		},
	]
}

export function playKeyDisplay(storage: StorageHandler, actions: Action[]): KeyDisplayTimeline {
	if (actions.length === 0) throw new Error('Actions array is empty')
	const action0 = actions[0]
	const multi = actions.length > 1

	const longestDuration: number = actions.reduce((max, action) => Math.max(max, action.part.resolved.duration), 0)

	const keyTimeline: KeyDisplayTimeline = [
		{
			id: 'idle_play',
			priority: -1,
			enable: { while: 1 },
			content: {
				attentionLevel: AttentionLevel.NEUTRAL,

				header: {
					long: `Play ${multi ? `#${actions.length}` : action0.part.name}`,
					short: `▶${multi ? `#${actions.length}` : action0.part.name.slice(-7)}`,
				},
				info: {
					long: `#duration(${longestDuration})`,
				},
			},
		},
	]

	// const playheads: { [groupId: string]: GroupPlayData } = {}

	for (const action of actions) {
		const playData = getGroupPlayData(action.group.preparedPlayData ?? null)
		const myPlayhead = playData.playheads[action.part.id]

		if (myPlayhead) {
			const id = `active_${action.part.id}`
			keyTimeline.push({
				id: id,
				// priority: now - myPlayhead.partEndTime, // will show the one which ends first, first
				enable: {
					start: myPlayhead.partStartTime,
					end: myPlayhead.partEndTime,
				},
				content: {
					attentionLevel: AttentionLevel.INFO,

					header: {
						long: `Play ${action.part.name}`,
						short: `▶${action.part.name.slice(-7)}`,
					},
					info: {
						long: `#countdown(${myPlayhead.partEndTime})`,
					},
				},
				keyframes: [
					{
						id: `${id}_kf_end`,
						enable: {
							// while: 1,
							start: `#${id}.end - 2000`,
							end: `#${id}.end`,
						},
						content: {
							attentionLevel: AttentionLevel.NOTIFY,
						},
					},
				],
			})
		}
	}

	return keyTimeline
}

// export function playErrorKeyDisplay(storage: StorageHandler, action: Action, e: any): KeyDisplayTimeline {
// 	const keyTimeline: KeyDisplayTimeline = [
// 		...generatePlayKeyDisplay(storage, action),
// 		{
// 			id: 'error',
// 			priority: 999,
// 			enable: {
// 				start: Date.now(),
// 				duration: 5 * 1000, // 5 seconds
// 			},
// 			content: {
// 				attentionLevel: AttentionLevel.INFO,

// 				header: {
// 					long: `Error`,
// 					short: `Error`,
// 				},
// 				info: {
// 					long: `${e}`,
// 				},
// 			},
// 		},
// 	]
// 	return keyTimeline
// }
