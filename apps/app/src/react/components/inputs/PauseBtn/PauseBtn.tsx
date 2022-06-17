import { Button } from '@mui/material'
import React from 'react'
import { IoPlaySkipBackSharp } from 'react-icons/io5'
import { MdPause, MdPlayArrow } from 'react-icons/md'
import { PlayButtonData } from '../StopBtn/StopBtn'
import './style.scss'

export const PauseBtn: React.FC<{
	groupId: string
	partId?: string
	disabled?: boolean
	className?: string
	onClick?: () => void
	data: PlayButtonData
}> = function PauseBtn(props) {
	const groupOrdisabled = props.data.groupDisabled || props.disabled
	let willDo: 'cue' | 'pause' | 'resume'
	let title: string
	let countAffectedParts: number
	if (props.partId) {
		// This is a pause button for a Part.

		countAffectedParts = 1
		if (props.data.partIsPlaying) {
			if (props.data.partIsPaused) {
				willDo = 'resume'
				title = 'Resume Part'
			} else {
				willDo = 'pause'
				title = 'Pause Part'
			}
		} else {
			willDo = 'cue'
			title = 'Cue Part'
		}
	} else {
		// This is a pause button for a Group.

		if (props.data.groupOneAtATime) {
			countAffectedParts = 1
			if (props.data.anyPartIsPlaying) {
				if (props.data.allPartsArePaused) {
					willDo = 'resume'
					title = 'Resume playing'
				} else {
					willDo = 'pause'
					title = 'Pause current Part'
				}
			} else {
				willDo = 'cue'
				title = 'Cue first part'
			}
		} else {
			if (props.data.anyPartIsPlaying) {
				countAffectedParts = props.data.playheadCount
				if (props.data.allPartsArePaused) {
					willDo = 'resume'
					title = 'Resume all paused Parts'
				} else {
					willDo = 'pause'
					title = 'Pause all playing Parts'
				}
			} else {
				countAffectedParts = props.data.countPlayablePartsInGroup
				willDo = 'cue'
				title = 'Cue all parts'
			}
		}
	}
	if (groupOrdisabled) {
		title += ' (disabled)'
	}

	return (
		<Button
			className={props.className}
			variant="contained"
			size="small"
			disabled={groupOrdisabled}
			onClick={props.onClick}
			title={title}
		>
			{willDo === 'cue' && <IoPlaySkipBackSharp size={18} />}
			{willDo === 'pause' && <MdPause size={22} />}
			{willDo === 'resume' && <MdPlayArrow size={18} />}

			{!props.partId && <div className="playcount">{countAffectedParts}</div>}
		</Button>
	)
}
