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
		const playheadTime = store.groupPlayDataStore.groups.get(props.groupId)?.playheads[props.partId]?.playheadTime
		return typeof playheadTime === 'number' ? msToTime(playheadTime) : null
	}, [props.groupId, props.partId])
	return <>{playheadTimeString}</>
})
