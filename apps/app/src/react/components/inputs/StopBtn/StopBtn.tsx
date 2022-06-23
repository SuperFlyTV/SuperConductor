import React from 'react'
import { MdStop } from 'react-icons/md'
import { Btn } from '../Btn/Btn'

export interface PlayButtonData {
	groupDisabled: boolean
	groupOneAtATime: boolean
	countPlayablePartsInGroup: number

	groupIsPlaying: boolean
	anyPartIsPlaying: boolean
	allPartsArePaused: boolean
	playheadCount: number
	partIsPlaying: boolean
	partIsPaused: boolean
}

export const StopBtn: React.FC<{
	groupId: string
	partId?: string
	disabled?: boolean
	className?: string
	onClick?: () => void

	data: PlayButtonData
}> = function StopBtn(props) {
	const groupOrPartDisabled = props.data.groupDisabled || props.disabled
	let canStop = false
	let title = ''
	if (props.partId) {
		// This is a play button for a Part.
		canStop = props.data.groupOneAtATime ? props.data.groupIsPlaying : props.data.partIsPlaying
		title = 'Stop playout of Part'
	} else {
		// This is a play button for a Group.
		canStop = props.data.anyPartIsPlaying
		title = props.data.groupOneAtATime ? 'Stop' : 'Stop playout of all Parts in Group'
	}

	return (
		<Btn
			className={props.className}
			variant="contained"
			size="small"
			disabled={groupOrPartDisabled || !canStop}
			onClick={props.onClick}
			title={title}
		>
			<MdStop size={22} />
		</Btn>
	)
}
