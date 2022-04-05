import React from 'react'
import { observer } from 'mobx-react-lite'
import { Part } from '../../../../models/rundown/Part'
import { store } from '../../../mobx/store'
import { useMemoComputedValue } from '../../../mobx/lib'

type PropsType = {
	groupId: string
	part: Part
}

export const PlayHead = observer(function PlayHead(props: PropsType) {
	const percentage = useMemoComputedValue(() => {
		const playhead = store.groupPlayDataStore.groups.get(props.groupId)?.playheads[props.part.id]

		if (!playhead) {
			return null
		}

		const playheadTime = playhead.playheadTime
		const duration = props.part.resolved.duration
		return (playheadTime / duration) * 100 + '%'
	}, [props.groupId, props.part.id])

	if (percentage === null) return null

	return (
		<div className="playHead">
			<div className="shade" style={{ width: percentage }}></div>
			<div className="line" style={{ left: percentage }}></div>
		</div>
	)
})
