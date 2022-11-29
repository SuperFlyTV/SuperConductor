import React from 'react'
import { observer } from 'mobx-react-lite'
import { store } from '../../../../../mobx/store'
import { useMemoComputedValue } from '../../../../../mobx/lib'
import { formatDuration } from '../../../../../../lib/timeLib'
import { DISPLAY_DECIMAL_COUNT } from '../../../../../constants'

type PropsType = {
	groupId: string
	partId: string
}

export const CurrentTime = observer(function CurrentTime(props: PropsType) {
	// Memoize this, to avoid recalculating it every time the playhead is calculated
	const playheadTimeString = useMemoComputedValue(() => {
		const group = store.groupPlayDataStore.groups.get(props.groupId)
		if (!group) return null

		const playhead = group?.playheads[props.partId]
		if (!playhead) return null

		const playheadTime = playhead.playheadTime
		return typeof playheadTime === 'number' ? formatDuration(playheadTime, DISPLAY_DECIMAL_COUNT) : null
	}, [props.groupId, props.partId])

	if (!playheadTimeString) return null

	return (
		<>
			<span className="part__time__current-time__label">ELAPSED</span>{' '}
			<span className="part__time__current-time__value">{playheadTimeString}</span>
		</>
	)
})
