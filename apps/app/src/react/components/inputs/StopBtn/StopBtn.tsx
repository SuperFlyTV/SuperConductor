import { Button } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React from 'react'
import { MdStop } from 'react-icons/md'
import { Group } from '../../../../models/rundown/Group'
import { Part } from '../../../../models/rundown/Part'
import { store } from '../../../mobx/store'

type StopBtnProps = {
	group: Group
	part?: Part
	className?: string
	onClick?: () => void
}

export const StopBtn: React.FC<StopBtnProps> = observer(function PlayBtn({ group, part, className, onClick }) {
	const playData = store.groupPlayDataStore.groups.get(group.id)

	if (!playData) {
		return null
	}

	const { groupIsPlaying, anyPartIsPlaying } = playData
	const partIsPlaying = Boolean(part && part.id in playData.playheads)
	const groupOrPartDisabled = group.disabled || part?.disabled
	let canStop = false
	let title = ''
	if (part) {
		// This is a play button for a Part.
		canStop = group.oneAtATime ? groupIsPlaying : partIsPlaying
		title = 'Stop playout of Part'
	} else {
		// This is a play button for a Group.
		canStop = anyPartIsPlaying
		title = group.oneAtATime ? 'Stop' : 'Stop playout of all Parts in Group'
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
