import React from 'react'
import { observer } from 'mobx-react-lite'
import { store } from '../../../../../mobx/store.js'
import { useMemoComputedValue } from '../../../../../mobx/lib.js'
import { formatDuration } from '../../../../../../lib/timeLib.js'
import { DISPLAY_DECIMAL_COUNT } from '../../../../../constants.js'

type PropsType = {
	groupId: string
	partId: string
}

export const RemainingTime = observer(function RemainingTime(props: PropsType) {
	const countDownTimeString = useMemoComputedValue(() => {
		const playhead = store.groupPlayDataStore.groups.get(props.groupId)?.playheads[props.partId]
		if (!playhead) return null

		if (playhead.partDuration === null) return null

		const countDownTime = playhead.partDuration - playhead.playheadTime
		if (!countDownTime) return null
		return formatDuration(countDownTime, DISPLAY_DECIMAL_COUNT, true)
	}, [props.groupId, props.partId])

	if (!countDownTimeString) return null

	return (
		<>
			<span className="part__time__remaining-time__label">REMAINING</span>{' '}
			<span className="part__time__remaining-time__value">{countDownTimeString}</span>
		</>
	)
})
