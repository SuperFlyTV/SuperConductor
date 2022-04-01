import React from 'react'
import { observer } from 'mobx-react-lite'
import { Part } from '../../../../models/rundown/Part'
import { store } from '../../../mobx/store'

type PropsType = {
	groupId: string
	part: Part
}

export const PlayHead = observer((props: PropsType) => {
	const playhead = store.groupPlayDataStore.groups.get(props.groupId)?.playheads[props.part.id]

	if (!playhead) {
		return null
	}

	const playheadTime = playhead.playheadTime
	const duration = props.part.resolved.duration
	const percentage = (playheadTime / duration) * 100 + '%'

	return (
		<div className="playHead">
			<div className="shade" style={{ width: percentage }}></div>
			<div className="line" style={{ left: percentage }}></div>
		</div>
	)
})
