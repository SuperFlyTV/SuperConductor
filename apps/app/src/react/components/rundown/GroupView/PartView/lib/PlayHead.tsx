import React from 'react'
import { observer } from 'mobx-react-lite'
import { store } from '../../../../../mobx/store'
import { useMemoComputedValue } from '../../../../../mobx/lib'
type PropsType = {
	groupId: string
	partId: string
	partViewDuration: number
}

export const PlayHead = observer(function PlayHead(props: PropsType) {
	const percentage: number | null = useMemoComputedValue(() => {
		const playhead = store.groupPlayDataStore.groups.get(props.groupId)?.playheads[props.partId]

		if (!playhead) return null
		if (!props.partViewDuration) {
			// The part is infinitely long
			if (playhead.partPauseTime !== undefined) return 0
			else return 100
		}

		return Math.min(1, playhead.playheadTime / props.partViewDuration) * 100
	}, [props.groupId, props.partId, props.partViewDuration])
	if (percentage === null) return null

	return (
		<div className="playHead">
			<div className="shade" style={{ right: `${100 - percentage}%` }}></div>
			<div className="line" style={{ left: `${percentage}%` }}></div>
		</div>
	)
})
