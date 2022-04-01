import React from 'react'
import { observer } from 'mobx-react-lite'
import { store } from '../../../../../mobx/store'
import { msToTime } from '@shared/lib'

type PropsType = {
	groupId: string
	partId: string
}

export const RemainingTime = observer(function RemainingTime(props: PropsType) {
	const playhead = store.groupPlayDataStore.groups.get(props.groupId)?.playheads[props.partId]

	if (!playhead) return null

	const countDownTime = playhead.partEndTime - playhead.partStartTime - playhead.playheadTime
	return <>{msToTime(countDownTime)}</>
})
