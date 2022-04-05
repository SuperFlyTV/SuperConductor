import { Button } from '@mui/material'
import { observer } from 'mobx-react-lite'
import { computed } from 'mobx'
import React from 'react'
import { MdStop } from 'react-icons/md'
import { Part } from '../../../../models/rundown/Part'
import { store } from '../../../mobx/store'
import { useMemoComputedObject } from '../../../mobx/lib'

type StopBtnProps = {
	groupId: string
	part?: Part
	className?: string
	onClick?: () => void
}

export const StopBtn: React.FC<StopBtnProps> = observer(function StopBtn({ groupId, part, className, onClick }) {
	const { groupIsPlaying, anyPartIsPlaying, partIsPlaying } = useMemoComputedObject(() => {
		const playData = store.groupPlayDataStore.groups.get(groupId)

		if (!playData) {
			return {
				groupIsPlaying: false,
				anyPartIsPlaying: false,
				partIsPlaying: false,
			}
		}
		return {
			groupIsPlaying: playData.groupIsPlaying,
			anyPartIsPlaying: playData.anyPartIsPlaying,
			partIsPlaying: Boolean(part && part.id in playData.playheads),
		}
	}, [groupId])

	const groupDisabled =
		computed(
			() => store.rundownsStore.currentRundown?.groups.find((group) => group.id === groupId)?.disabled
		).get() || false
	const groupOneAtATime =
		computed(
			() => store.rundownsStore.currentRundown?.groups.find((group) => group.id === groupId)?.oneAtATime
		).get() || false

	const groupOrPartDisabled = groupDisabled || part?.disabled
	let canStop = false
	let title = ''
	if (part) {
		// This is a play button for a Part.
		canStop = groupOneAtATime ? groupIsPlaying : partIsPlaying
		title = 'Stop playout of Part'
	} else {
		// This is a play button for a Group.
		canStop = anyPartIsPlaying
		title = groupOneAtATime ? 'Stop' : 'Stop playout of all Parts in Group'
	}

	return (
		<Button
			className={className}
			variant="contained"
			size="small"
			disabled={groupOrPartDisabled || !canStop}
			onClick={onClick}
			title={title}
		>
			<MdStop size={22} />
		</Button>
	)
})
