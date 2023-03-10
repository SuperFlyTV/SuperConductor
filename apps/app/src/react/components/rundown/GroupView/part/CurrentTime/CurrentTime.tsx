import React from 'react'
import { observer } from 'mobx-react-lite'
import { store } from '../../../../../mobx/store'
import { useMemoComputedObject } from '../../../../../mobx/lib'
import { formatDuration } from '../../../../../../lib/timeLib'
import { DISPLAY_DECIMAL_COUNT } from '../../../../../constants'

type PropsType = {
	groupId: string
	partId: string
}

export const CurrentTime = observer(function CurrentTime(props: PropsType) {
	// Memoize this, to avoid recalculating it every time the playhead is calculated
	const { value, label } = useMemoComputedObject(
		() => {
			const playData = store.groupPlayDataStore.groups.get(props.groupId)
			if (playData) {
				const playhead = playData.playheads[props.partId]
				const countDowns = playData.countdowns[props.partId] ?? []
				if (playhead) {
					const playheadTime = playhead.playheadTime
					if (typeof playheadTime === 'number') {
						return {
							label: 'ELAPSED',
							value: formatDuration(playheadTime, DISPLAY_DECIMAL_COUNT),
						}
					}
				} else if (countDowns.length > 0) {
					const countDown = countDowns[0]

					return {
						label: 'TO START',
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
			<span className="part__time__current-time__label">{label}</span>{' '}
			<span className="part__time__current-time__value">{value}</span>
		</>
	)
})
