import { Button } from '@mui/material'
import { observer } from 'mobx-react-lite'
import { computed } from 'mobx'
import React from 'react'
import { IoPlaySkipBackSharp } from 'react-icons/io5'
import { MdPause, MdPlayArrow } from 'react-icons/md'
import { Part } from '../../../../models/rundown/Part'
import { store } from '../../../mobx/store'
import { useMemoComputedObject } from '../../../mobx/lib'
import './style.scss'

type PauseBtnProps = {
	groupId: string
	part?: Part
	className?: string
	onClick?: () => void
}

export const PauseBtn: React.FC<PauseBtnProps> = observer(function PauseBtn({ groupId, part, className, onClick }) {
	const { anyPartIsPlaying, allPartsArePaused, partIsPlaying, partIsPaused, playheadCount } =
		useMemoComputedObject(() => {
			const playData = store.groupPlayDataStore.groups.get(groupId)

			if (!playData) {
				return {
					anyPartIsPlaying: false,
					allPartsArePaused: false,
					partIsPlaying: false,
					partIsPaused: false,
					playheadCount: 0,
				}
			}
			const playhead = part && playData.playheads[part?.id]
			return {
				anyPartIsPlaying: playData.anyPartIsPlaying,
				allPartsArePaused: playData.allPartsArePaused,
				partIsPlaying: Boolean(playhead),
				partIsPaused: Boolean(playhead && playhead.partPauseTime !== undefined),
				playheadCount: Object.keys(playData.playheads).length,
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
	const countPlayablePartsInGroup =
		computed(() => {
			const group = store.rundownsStore.currentRundown?.groups.find((group) => group.id === groupId)
			if (!group) return 0
			return group.parts.filter((p) => !p.disabled).length
		}).get() ?? 0

	const groupOrPartDisabled = groupDisabled || part?.disabled
	let willDo: 'cue' | 'pause' | 'resume'
	let title: string
	let countAffectedParts: number
	if (part) {
		// This is a pause button for a Part.

		countAffectedParts = 1
		if (partIsPlaying) {
			if (partIsPaused) {
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

		if (groupOneAtATime) {
			countAffectedParts = 1
			if (anyPartIsPlaying) {
				if (allPartsArePaused) {
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
			if (anyPartIsPlaying) {
				countAffectedParts = playheadCount
				if (allPartsArePaused) {
					willDo = 'resume'
					title = 'Resume all paused Parts'
				} else {
					willDo = 'pause'
					title = 'Pause all playing Parts'
				}
			} else {
				countAffectedParts = countPlayablePartsInGroup
				willDo = 'cue'
				title = 'Cue all parts'
			}
		}
	}
	if (groupOrPartDisabled) {
		title += ' (disabled)'
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
			{willDo === 'cue' && <IoPlaySkipBackSharp size={18} />}
			{willDo === 'pause' && <MdPause size={22} />}
			{willDo === 'resume' && <MdPlayArrow size={18} />}

			{!part && <div className="playcount">{countAffectedParts}</div>}
		</Button>
	)
})
