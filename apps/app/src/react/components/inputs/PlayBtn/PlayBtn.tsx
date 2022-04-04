import { Button } from '@mui/material'
import { observer } from 'mobx-react-lite'
import React from 'react'
import { IoPlaySkipBackSharp } from 'react-icons/io5'
import { MdPlayArrow } from 'react-icons/md'
import { Group } from '../../../../models/rundown/Group'
import { Part } from '../../../../models/rundown/Part'
import { store } from '../../../mobx/store'
import { useMemoComputedObject } from '../../../mobx/lib'
import './style.scss'

type PlayBtnProps = {
	group: Group
	part?: Part
	className?: string
	onClick?: () => void
}

export const PlayBtn: React.FC<PlayBtnProps> = observer(function PlayBtn({ group, part, className, onClick }) {
	const { groupIsPlaying, anyPartIsPlaying, partIsPlaying } = useMemoComputedObject(() => {
		const playData = store.groupPlayDataStore.groups.get(group.id)

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
	}, [group.id])

	const groupOrPartDisabled = group.disabled || part?.disabled
	let canRestart = false
	let title = ''
	if (part) {
		// This is a play button for a Part.
		canRestart = partIsPlaying
		title = canRestart ? 'Restart Part' : 'Play Part'
	} else {
		// This is a play button for a Group.
		canRestart = groupIsPlaying || anyPartIsPlaying
		title = group.oneAtATime
			? canRestart
				? 'Restart and play first Part'
				: 'Play first Part'
			: canRestart
			? 'Restart and play all Parts in Group'
			: 'Play all Parts in Group'
	}

	return (
		<Button
			className={className}
			variant="contained"
			size="small"
			disabled={groupOrPartDisabled}
			onClick={onClick}
			title={title}
		>
			{canRestart ? <IoPlaySkipBackSharp size={18} /> : <MdPlayArrow size={22} />}
			{!part && (
				<div className="playcount">{group.oneAtATime ? 1 : group.parts.filter((p) => !p.disabled).length}</div>
			)}
		</Button>
	)
})
