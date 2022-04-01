import React from 'react'
import { observer } from 'mobx-react-lite'
import { store } from '../../../../../mobx/store'
import { CountDownHead } from './CountdownHead'

type PropsType = {
	groupId: string
	partId: string
}

export const CountdownHeads = observer(function CountdownHeads(props: PropsType) {
	const playhead = store.groupPlayDataStore.groups.get(props.groupId)

	if (!playhead) return null

	const timesUntilStart = (playhead.anyPartIsPlaying && playhead.countdowns[props.partId]) || null

	return (
		<>
			{timesUntilStart &&
				timesUntilStart.map((timeUntilStart, index) => (
					<CountDownHead key={index} timeUntilStart={timeUntilStart} />
				))}
		</>
	)
})
