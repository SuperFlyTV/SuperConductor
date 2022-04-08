import React from 'react'
import { observer } from 'mobx-react-lite'
import { store } from '../../../../../mobx/store'
import { CountDownHead } from './CountdownHead'
import { useMemoComputedObject } from '../../../../../mobx/lib'

type PropsType = {
	groupId: string
	partId: string
}

export const CountdownHeads = observer(function CountdownHeads(props: PropsType) {
	const timesUntilStart = useMemoComputedObject(() => {
		const playhead = store.groupPlayDataStore.groups.get(props.groupId)

		if (!playhead) return null

		return (playhead.anyPartIsPlaying && playhead.countdowns[props.partId]) || null
	}, [props.groupId, props.partId])

	return (
		<>
			{timesUntilStart &&
				timesUntilStart.map((timeUntilStart, index) => (
					<CountDownHead key={index} timeUntilStart={timeUntilStart} />
				))}
		</>
	)
})
