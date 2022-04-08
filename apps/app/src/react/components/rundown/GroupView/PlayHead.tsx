import React from 'react'
import { observer } from 'mobx-react-lite'
import { Part } from '../../../../models/rundown/Part'
import { store } from '../../../mobx/store'
import { useMemoComputedValue } from '../../../mobx/lib'

type PropsType = {
	groupId: string
	part: Part
	partViewDuration: number
}

export const PlayHead = observer(function PlayHead(props: PropsType) {
	const percentage: number | null = useMemoComputedValue(() => {
		const playhead = store.groupPlayDataStore.groups.get(props.groupId)?.playheads[props.part.id]

		if (!playhead) return null
		if (!props.partViewDuration) return 100 // infinitely long

		return Math.min(1, playhead.playheadTime / props.partViewDuration) * 100
	}, [props.groupId, props.part.id, props.partViewDuration])
	if (percentage === null) return null

	return (
		<div className="playHead">
			<div className="shade" style={{ right: `${100 - percentage}%` }}></div>
			<div className="line" style={{ left: `${percentage}%` }}></div>
		</div>
	)
})
