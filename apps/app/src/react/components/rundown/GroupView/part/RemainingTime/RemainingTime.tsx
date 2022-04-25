import React from 'react'
import { observer } from 'mobx-react-lite'
import { msToTime } from '@shared/lib'
import { store } from '../../../../../mobx/store'
import { useMemoComputedValue } from '../../../../../mobx/lib'

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
		return msToTime(countDownTime)
	}, [props.groupId, props.partId])

	if (!countDownTimeString) return null

	return <>{countDownTimeString}</>
})
