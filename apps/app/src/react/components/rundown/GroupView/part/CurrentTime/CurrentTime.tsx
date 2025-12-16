import React from 'react'
import { observer } from 'mobx-react-lite'
import { store } from '../../../../../mobx/store.js'
import { useMemoComputedObject } from '../../../../../mobx/lib.js'
import { formatDuration } from '../../../../../../lib/timeLib.js'
import { DISPLAY_DECIMAL_COUNT } from '../../../../../constants.js'

type PropsType = {
	groupId: string
	partId: string
}

export const CurrentTime = observer(function CurrentTime(props: PropsType) {
	// Memoize this, to avoid recalculating it every time the playhead is calculated
	const { value, label, value2, label2 } = useMemoComputedObject(
		() => {
			const playData = store.groupPlayDataStore.groups.get(props.groupId)
			if (playData) {
				const playhead = playData.playheads[props.partId]
				const countDowns = playData.countdowns[props.partId] ?? []
				if (playhead) {
					const playheadTime = playhead.playheadTime
					if (typeof playheadTime === 'number') {
						// Calculate the start time (current time minus playheadTime)
						const startTime = new Date(new Date().getTime() - playheadTime)
						return {
							label2: 'Started at',
							value2: startTime.toLocaleTimeString(), // Start time
							label: 'ELAPSED',
							value: formatDuration(playheadTime, DISPLAY_DECIMAL_COUNT),
						}
					}
				} else if (countDowns.length > 0) {
					const countDown = countDowns[0]

					return {
						label2: 'Start Time ',
						value2: new Date(countDown.timestamp).toLocaleTimeString(),
						label: 'Starting in',
						value: formatDuration(countDown.duration, DISPLAY_DECIMAL_COUNT, true),
					}
				}
			}
			// else:
			return {
				label: '',
				value: null,
			}
		},
		[props.groupId, props.partId],
		true
	)

	if (!value) return null
	if (!label) return null

	return (
		<>
			<span className="part__time__current-time__label2">{label2}</span>{' '}
			<span className="part__time__current-time__value2">{value2}</span>{' '}
			<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
			<span className="part__time__current-time__label">{label}</span>{' '}
			<span className="part__time__current-time__value">{value}</span>
		</>
	)
})
