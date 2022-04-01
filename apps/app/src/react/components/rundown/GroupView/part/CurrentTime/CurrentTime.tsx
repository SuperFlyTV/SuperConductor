import React from 'react'
import { observer } from 'mobx-react-lite'
import { store } from '../../../../../mobx/store'
import { msToTime } from '@shared/lib'

type PropsType = {
	groupId: string
	partId: string
}

export const CurrentTime = observer(function CurrentTime(props: PropsType) {
	const playheadTime = store.groupPlayDataStore.groups.get(props.groupId)?.playheads[props.partId]?.playheadTime
	return <>{typeof playheadTime === 'number' ? msToTime(playheadTime) : null}</>
})
