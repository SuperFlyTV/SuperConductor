import { Button } from '@mui/material'
import React from 'react'
import { MdPlayArrow, MdReplay } from 'react-icons/md'
import { PlayButtonData } from '../StopBtn/StopBtn'

import './style.scss'
export const PlayBtn: React.FC<{
	groupId: string
	partId?: string
	disabled?: boolean
	className?: string
	onClick?: () => void
	data: PlayButtonData
}> = function PlayBtn(props) {
	const groupOrPartDisabled = props.data.groupDisabled || props.disabled
	let willDo: 'play' | 'restart'
	let title: string
	if (props.partId) {
		// This is a play button for a Part.
		if (props.data.partIsPlaying) {
			willDo = 'restart'
			title = 'Restart Part'
		} else {
			willDo = 'play'
			title = 'Play Part'
		}
	} else {
		// This is a play button for a Group.
		if (props.data.groupOneAtATime) {
			if (props.data.groupIsPlaying) {
				willDo = 'restart'
				title = 'Restart and play first Part'
			} else {
				willDo = 'play'
				title = 'Play first Part'
			}
		} else {
			if (props.data.anyPartIsPlaying) {
				willDo = 'restart'
				title = 'Restart and play all Parts in Group'
			} else {
				willDo = 'play'
				title = 'Play all Parts in Group'
			}
		}
	}

	return (
		<Button
			className={props.className}
			variant="contained"
			size="small"
			disabled={groupOrPartDisabled}
			onClick={props.onClick}
			title={title}
		>
			{willDo === 'play' && <MdPlayArrow size={22} />}
			{willDo === 'restart' && <MdReplay size={18} />}
			{!props.partId && (
				<div className="playcount">{props.data.groupOneAtATime ? 1 : props.data.countPlayablePartsInGroup}</div>
			)}
		</Button>
	)
}
