import { Button } from '@mui/material'
import { observer } from 'mobx-react-lite'
import { computed } from 'mobx'
import React from 'react'

import { MdPlayArrow, MdReplay } from 'react-icons/md'
import { Part } from '../../../../models/rundown/Part'
import { store } from '../../../mobx/store'
import { useMemoComputedObject } from '../../../mobx/lib'
import './style.scss'

type PlayBtnProps = {
	groupId: string
	part?: Part
	className?: string
	onClick?: () => void
}

export const PlayBtn: React.FC<PlayBtnProps> = observer(function PlayBtn({ groupId, part, className, onClick }) {
	const { groupIsPlaying, anyPartIsPlaying, partIsPlaying } = useMemoComputedObject(() => {
		const playData = store.groupPlayDataStore.groups.get(groupId)

		if (!playData) {
			return {
				groupIsPlaying: false,
				anyPartIsPlaying: false,
				partIsPlaying: false,
				partIsPaused: false,
			}
		}
		const playhead = part && playData.playheads[part?.id]
		return {
			groupIsPlaying: playData.groupIsPlaying,
			anyPartIsPlaying: playData.anyPartIsPlaying,
			partIsPlaying: Boolean(playhead),
			partIsPaused: Boolean(playhead && playhead.partPauseTime !== undefined),
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
	const numNonDisabledPartsInGroup =
		computed(
			() =>
				store.rundownsStore.currentRundown?.groups
					.find((group) => group.id === groupId)
					?.parts.filter((p) => !p.disabled).length
		).get() ?? 0

	const groupOrPartDisabled = groupDisabled || part?.disabled
	let willDo: 'play' | 'restart'
	let title: string
	if (part) {
		// This is a play button for a Part.
		if (partIsPlaying) {
			willDo = 'restart'
			title = 'Restart Part'
		} else {
			willDo = 'play'
			title = 'Play Part'
		}
	} else {
		// This is a play button for a Group.
		if (groupOneAtATime) {
			if (groupIsPlaying) {
				willDo = 'restart'
				title = 'Restart and play first Part'
			} else {
				willDo = 'play'
				title = 'Play first Part'
			}
		} else {
			if (anyPartIsPlaying) {
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
			className={className}
			variant="contained"
			size="small"
			disabled={groupOrPartDisabled}
			onClick={onClick}
			title={title}
		>
			{willDo === 'play' && <MdPlayArrow size={22} />}
			{willDo === 'restart' && <MdReplay size={18} />}
			{!part && <div className="playcount">{groupOneAtATime ? 1 : numNonDisabledPartsInGroup}</div>}
		</Button>
	)
})
