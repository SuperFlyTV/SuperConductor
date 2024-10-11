import React from 'react'
import { observer } from 'mobx-react-lite'
import { store } from '../../../../../mobx/store.js'
import { CountDownHead } from './CountdownHead.js'
import { useMemoComputedObject } from '../../../../../mobx/lib.js'

type PropsType = {
	groupId: string
	partId: string
}

export const CountdownHeads = observer(function CountdownHeads(props: PropsType) {
	const timesUntilStart = useMemoComputedObject(() => {
		const playData = store.groupPlayDataStore.groups.get(props.groupId)

		if (!playData) return null

		return playData.countdowns[props.partId] || null
	}, [props.groupId, props.partId])

	return (
		<>
			{timesUntilStart &&
				timesUntilStart.map((timeUntilStart, index) => (
					<CountDownHead key={index} timeUntilStart={timeUntilStart.duration} />
				))}
		</>
	)
})
