import { getGroupPlayData, GroupPlayDataPlayhead } from '../lib/playout/groupPlayData'
import { findPartInGroup } from '../lib/util'
import { Group } from '../models/rundown/Group'
import { Part } from '../models/rundown/Part'

export function stopGroup(group: Group, now: number): void {
	for (const partId of Object.keys(group.playout.playingParts)) {
		group.playout.playingParts[partId].stopTime = now
	}
}
export function playGroup(group: Group, now: number): void {
	if (group.oneAtATime) {
		// Play the first non-disabled part:
		const part = group.parts.find((p) => !p.disabled)
		if (part) {
			playPart(group, part, now)
		}
	} else {
		// Play all parts (disabled parts won't get played)
		const partIds = group.parts.map((part) => part.id)
		for (const partId of partIds) {
			const part = findPartInGroup(group, partId)
			if (!part) throw new Error(`Part ${partId} not found in group ${group.id} ("${group.name}").`)

			playPart(group, part, now)
		}
	}
}

export function stopPart(group: Group, partId: string, now: number): void {
	if (group.oneAtATime) {
		// Stop the group:
		stopGroup(group, now)
	} else {
		// Stop the part:
		const playingPart = group.playout.playingParts[partId]
		if (playingPart) {
			playingPart.stopTime = now
		}
	}
}

export function playPart(group: Group, part: Part, now: number): void {
	if (part.disabled) return

	if (group.oneAtATime) {
		// Anything already playing should be stopped:
		group.playout.playingParts = {}
	}
	if (!group.playout.playingParts) group.playout.playingParts = {}
	// Start playing this Part:
	group.playout.playingParts[part.id] = {
		startTime: now,
		pauseTime: undefined,
		stopTime: undefined,
		fromSchedule: false,
	}
}

export function pausePart(group: Group, part: Part, pauseTime: number | undefined, now: number): void {
	if (part.disabled) return

	if (!group.playout.playingParts) group.playout.playingParts = {}

	if (group.oneAtATime) {
		// If any other parts are playing, they should be stopped:
		for (const partId of Object.keys(group.playout.playingParts)) {
			if (partId !== part.id) {
				// console.log('stop part', partId)
				group.playout.playingParts[partId].stopTime = now
			}
		}
	}
	const playData = getGroupPlayData(group.preparedPlayData, now)
	const playhead = playData.playheads[part.id] as GroupPlayDataPlayhead | undefined
	// const existingPlayingPart = group.playout.playingParts[part.id] as PlayingPart | undefined

	// Handle this Part:
	if (playhead) {
		if (playhead.partPauseTime === undefined) {
			// The part is playing, so it should be paused:
			group.playout.playingParts[part.id] = {
				startTime: playhead.partStartTime,
				pauseTime:
					pauseTime ??
					// If a specific pauseTime not specified, pause at the current time:
					now - playhead.partStartTime,
				stopTime: undefined,
				fromSchedule: false,
			}
		} else {
			// The part is paused, so it should be resumed:
			group.playout.playingParts[part.id] = {
				startTime: now - playhead.partPauseTime,
				pauseTime: undefined,
				stopTime: undefined,
				fromSchedule: false,
			}
		}
	} else {
		// Part is not playing, cue (pause) it at the time specified:
		group.playout.playingParts[part.id] = {
			startTime: now,
			pauseTime: pauseTime ?? 0,
			stopTime: undefined,
			fromSchedule: false,
		}
	}
}
