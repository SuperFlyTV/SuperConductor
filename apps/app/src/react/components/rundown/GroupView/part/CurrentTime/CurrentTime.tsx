import React from 'react'
import { observer } from 'mobx-react-lite'
import { msToTime } from '@shared/lib'
import { store } from '../../../../../mobx/store'
import { useMemoComputedValue } from '../../../../../mobx/lib'

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
		return typeof playheadTime === 'number' ? msToTime(playheadTime) : null
	}, [props.groupId, props.partId])
	return <>{playheadTimeString}</>
})
