import { prepareGroupPlayData } from '../preparedGroupPlayData'
import { getDefaultGroup, getDefaultPart } from '../../defaults'
import { Group } from '../../../models/rundown/Group'
import * as RundownActions from '../../../electron/rundownActions'
import { findPartInGroup, updateGroupPlayingParts } from '../../util'
import { Part } from '../../../models/rundown/Part'
import { getGroupPlayData } from '../groupPlayData'
import { PlayPartEndAction, SectionEndAction } from '../../../models/GUI/PreparedPlayhead'

describe('prepareGroupPlayData', () => {
	describe('Default Group', () => {
		// Tests a Group that has no settings set apart from the default
		function getTestGroup(): Group {
			return getCommonGroup()
		}

		test('Idle', () => {
			const group0 = getTestGroup()
			expect(group0.oneAtATime).toBeTruthy()
			const prepared = prepareGroupPlayData(group0, 1000)
			expect(prepared).toBe(null)

			const playData = getGroupPlayData(prepared, 1000)
			expect(playData).toMatchObject({
				groupIsPlaying: false,
				anyPartIsPlaying: false,
				// allPartsArePaused: true,
				sectionTimeToEnd: null,
				sectionEndTime: null,
				sectionEndAction: null,
			})
			expect(Object.keys(playData.playheads)).toHaveLength(0)
			expect(playData).toMatchSnapshot()
		})
		test('Play Part A when stopped', () => {
			const group0 = getTestGroup()
			expect(group0.oneAtATime).toBeTruthy()

			const part = getPart(group0, 'partA')

			// Play the part:
			RundownActions.playPart(group0, part, 1000)
			postProcessGroup(group0, 1000)

			{
				const prepared = prepareGroupPlayData(group0, 1001)
				if (!prepared) throw new Error('Prepared is falsy')
				expect(prepared).toMatchSnapshot()

				const playData = getGroupPlayData(prepared, 1001)

				expect(playData).toMatchObject({
					groupIsPlaying: true,
					anyPartIsPlaying: true,
					allPartsArePaused: false,
					sectionTimeToEnd: 999,
					sectionEndTime: 2000,
					sectionEndAction: SectionEndAction.STOP,
				})
				expect(Object.keys(playData.playheads)).toHaveLength(1)
				expect(playData.playheads['partA']).toMatchObject({
					playheadTime: 1,
					partStartTime: 1000,
					partPauseTime: undefined,
					partEndTime: 2000,
					partDuration: 1000,
					partId: 'partA',
					endAction: PlayPartEndAction.STOP,
					fromSchedule: false,
				})
				expect(Object.keys(playData.countdowns)).toHaveLength(0)
				expect(playData).toMatchSnapshot()

				// Check that it would stop playing after a while:
				const playDataLater = getGroupPlayData(prepared, 2001)
				expect(Object.keys(playDataLater.playheads)).toHaveLength(0)
				expect(Object.keys(playDataLater.countdowns)).toHaveLength(0)
			}

			// Now pause the part:
			RundownActions.pausePart(group0, part, undefined, 1100)
			postProcessGroup(group0, 1100)
			{
				const prepared = prepareGroupPlayData(group0, 1100)
				if (!prepared) throw new Error('Prepared is falsy')
				expect(prepared).toMatchSnapshot()

				const playData = getGroupPlayData(prepared, 1101)

				expect(playData).toMatchObject({
					groupIsPlaying: true,

					anyPartIsPlaying: true,
					allPartsArePaused: true,

					sectionTimeToEnd: 900,
					sectionEndTime: null,
					sectionEndAction: SectionEndAction.INFINITE,
				})
				expect(Object.keys(playData.playheads)).toHaveLength(1)
				expect(playData.playheads['partA']).toMatchObject({
					playheadTime: 100,
					partStartTime: 1000,
					partPauseTime: 100,
					partEndTime: 2000,
					partDuration: 1000,
					partId: 'partA',
					endAction: PlayPartEndAction.STOP,
					fromSchedule: false,
				})
				expect(Object.keys(playData.countdowns)).toHaveLength(0)
				expect(playData).toMatchSnapshot()
			}

			// Now resume playing the part:
			RundownActions.pausePart(group0, part, undefined, 3000)
			postProcessGroup(group0, 3000)

			{
				const prepared = prepareGroupPlayData(group0, 3001)
				if (!prepared) throw new Error('Prepared is falsy')
				expect(prepared).toMatchSnapshot()

				const playData = getGroupPlayData(prepared, 3001)

				expect(playData).toMatchObject({
					groupIsPlaying: true,
					anyPartIsPlaying: true,
					allPartsArePaused: false,
					sectionTimeToEnd: 899,
					sectionEndTime: 3900,
					sectionEndAction: SectionEndAction.STOP,
				})
				expect(Object.keys(playData.playheads)).toHaveLength(1)
				expect(playData.playheads['partA']).toMatchObject({
					playheadTime: 101,
					partStartTime: 2900,
					partPauseTime: undefined,
					partEndTime: 3900,
					partDuration: 1000,
					partId: 'partA',
					endAction: PlayPartEndAction.STOP,
					fromSchedule: false,
				})
				expect(Object.keys(playData.countdowns)).toHaveLength(0)
				expect(playData).toMatchSnapshot()

				// Check that it would stop playing after a while:
				const playDataLater = getGroupPlayData(prepared, 4001)
				expect(Object.keys(playDataLater.playheads)).toHaveLength(0)
				expect(Object.keys(playDataLater.countdowns)).toHaveLength(0)
			}

			// Now stop the part:
			RundownActions.stopPart(group0, 'partA', 3500)
			postProcessGroup(group0, 3500)
			{
				const prepared = prepareGroupPlayData(group0, 3501)
				if (!prepared) throw new Error('Prepared is falsy')
				expect(prepared).toMatchSnapshot()

				const playData = getGroupPlayData(prepared, 3501)
				expect(playData).toMatchObject({
					groupIsPlaying: false,
					anyPartIsPlaying: false,
					// allPartsArePaused: true,
					sectionTimeToEnd: null,
					sectionEndTime: null,
					sectionEndAction: null,
				})
				expect(Object.keys(playData.playheads)).toHaveLength(0)
				expect(playData).toMatchSnapshot()
			}
		})
		test('Play Looping Part A when stopped', () => {
			const group0 = getTestGroup()
			expect(group0.oneAtATime).toBeTruthy()

			const part = getPart(group0, 'partA')
			// Set the part to be looping:
			part.loop = true

			// Play the part:
			RundownActions.playPart(group0, part, 1000)
			postProcessGroup(group0, 1000)

			{
				const prepared = prepareGroupPlayData(group0, 1000)
				if (!prepared) throw new Error('Prepared is falsy')
				expect(prepared).toMatchSnapshot()

				const playData = getGroupPlayData(prepared, 1001)

				expect(playData).toMatchObject({
					groupIsPlaying: true,
					anyPartIsPlaying: true,
					allPartsArePaused: false,
					// playheads: {
					// 	[partId: string]: GroupPlayDataPlayhead
					// }
					// countdowns: { [partId: string]: number[] }
					sectionTimeToEnd: 999,
					sectionEndTime: 2000,
					sectionEndAction: SectionEndAction.LOOP_SELF,
				})
				expect(Object.keys(playData.playheads)).toHaveLength(1)
				expect(playData.playheads['partA']).toMatchObject({
					playheadTime: 1,
					partStartTime: 1000,
					partPauseTime: undefined,
					partEndTime: 2000,
					partDuration: 1000,
					partId: 'partA',
					// endAction: PlayPartEndAction.LOOP_SELF,
					fromSchedule: false,
				})
				expect(Object.keys(playData.countdowns)).toHaveLength(1)
				expect(playData.countdowns['partA']).toMatchObject([
					{
						duration: 999,
						timestamp: 2000,
					},
				])

				expect(playData).toMatchSnapshot()
			}

			// Now stop the part:
			RundownActions.stopPart(group0, 'partA', 1500)
			postProcessGroup(group0, 1500)
			{
				const prepared = prepareGroupPlayData(group0, 1500)
				if (!prepared) throw new Error('Prepared is falsy')
				expect(prepared).toMatchSnapshot()

				const playData = getGroupPlayData(prepared, 1501)
				expect(playData).toMatchObject({
					groupIsPlaying: false,
					anyPartIsPlaying: false,
					// allPartsArePaused: true,
					sectionTimeToEnd: null,
					sectionEndTime: null,
					sectionEndAction: null,
				})
				expect(Object.keys(playData.playheads)).toHaveLength(0)
				expect(playData).toMatchSnapshot()
			}
		})
	})

	describe('Playlist Group', () => {
		// Tests a Group set as a playlist
		function getTestGroup(): Group {
			const group = getCommonGroup()
			group.oneAtATime = true
			group.autoPlay = true
			group.loop = false
			return group
		}
		test('Play Group', () => {
			const group0 = getTestGroup()

			// Play the part:
			RundownActions.playGroup(group0, 1000)
			postProcessGroup(group0, 1000)

			const prepared = prepareGroupPlayData(group0, 1001)
			if (!prepared) throw new Error('Prepared is falsy')
			expect(prepared).toMatchSnapshot()

			// Check that Part A is playing:
			{
				const playData = getGroupPlayData(prepared, 1001)
				expect(playData).toMatchObject({
					groupIsPlaying: true,
					anyPartIsPlaying: true,
					allPartsArePaused: false,
					sectionTimeToEnd: 9999,
					sectionEndTime: 11000,
					sectionEndAction: SectionEndAction.STOP,
				})
				expect(Object.keys(playData.playheads)).toHaveLength(1)
				expect(playData.playheads['partA']).toMatchObject({
					playheadTime: 1,
					partStartTime: 1000,
					partPauseTime: undefined,
					partEndTime: 2000,
					partDuration: 1000,
					partId: 'partA',
					endAction: PlayPartEndAction.NEXT_PART,
					fromSchedule: false,
				})
				expect(Object.keys(playData.countdowns)).toStrictEqual(['partB', 'partC', 'partD'])
			}
			// Check that Part B plays next:
			{
				const playData = getGroupPlayData(prepared, 2300)
				expect(playData).toMatchObject({
					groupIsPlaying: true,
					anyPartIsPlaying: true,
					allPartsArePaused: false,
					sectionTimeToEnd: 8700,
					sectionEndTime: 11000,
					sectionEndAction: SectionEndAction.STOP,
				})
				expect(Object.keys(playData.playheads)).toHaveLength(1)
				expect(playData.playheads['partB']).toMatchObject({
					playheadTime: 300,
					partStartTime: 2000,
					partPauseTime: undefined,
					partEndTime: 4000,
					partDuration: 2000,
					partId: 'partB',
					endAction: PlayPartEndAction.NEXT_PART,
					fromSchedule: false,
				})
				expect(Object.keys(playData.countdowns)).toStrictEqual(['partC', 'partD'])
			}
			// Check that the Group stops eventually:
			{
				const playData = getGroupPlayData(prepared, 11001)
				expect(playData).toMatchObject({
					groupIsPlaying: false,
					anyPartIsPlaying: false,
					// allPartsArePaused: true,
					sectionTimeToEnd: null,
					sectionEndTime: null,
					sectionEndAction: null,
				})
				expect(Object.keys(playData.playheads)).toHaveLength(0)
				expect(Object.keys(playData.countdowns)).toHaveLength(0)
			}
		})
		test('Play Part B', () => {
			const group0 = getTestGroup()
			expect(group0.oneAtATime).toBeTruthy()

			const part = getPart(group0, 'partB')

			// Play the part:
			RundownActions.playPart(group0, part, 1000)
			postProcessGroup(group0, 1000)

			{
				const prepared = prepareGroupPlayData(group0, 1001)
				if (!prepared) throw new Error('Prepared is falsy')

				const playData = getGroupPlayData(prepared, 1001)

				expect(playData).toMatchObject({
					groupIsPlaying: true,
					anyPartIsPlaying: true,
					allPartsArePaused: false,
					sectionTimeToEnd: 8999,
					sectionEndTime: 10000,
					sectionEndAction: SectionEndAction.STOP,
				})
				expect(Object.keys(playData.playheads)).toHaveLength(1)
				expect(playData.playheads['partB']).toMatchObject({
					playheadTime: 1,
					partStartTime: 1000,
					partPauseTime: undefined,
					partEndTime: 3000,
					partDuration: 2000,
					partId: 'partB',
					endAction: PlayPartEndAction.NEXT_PART,
					fromSchedule: false,
				})
				expect(Object.keys(playData.countdowns)).toStrictEqual(['partC', 'partD'])
			}

			// Now pause the part:
			RundownActions.pausePart(group0, part, undefined, 1100)
			postProcessGroup(group0, 1100)
			{
				const prepared = prepareGroupPlayData(group0, 1100)
				if (!prepared) throw new Error('Prepared is falsy')
				expect(prepared).toMatchSnapshot()

				const playData = getGroupPlayData(prepared, 1101)

				expect(playData).toMatchObject({
					groupIsPlaying: true,

					anyPartIsPlaying: true,
					allPartsArePaused: true,

					sectionTimeToEnd: 8900,
					sectionEndTime: null,
					sectionEndAction: SectionEndAction.INFINITE,
				})
				expect(Object.keys(playData.playheads)).toHaveLength(1)
				expect(playData.playheads['partB']).toMatchObject({
					playheadTime: 100,
					partStartTime: 1000,
					partPauseTime: 100,
					partEndTime: 3000,
					partDuration: 2000,
					partId: 'partB',
					endAction: PlayPartEndAction.NEXT_PART,
					fromSchedule: false,
				})
				expect(Object.keys(playData.countdowns)).toHaveLength(0)
			}

			// Now resume playing the part:
			RundownActions.pausePart(group0, part, undefined, 3000)
			postProcessGroup(group0, 3000)

			{
				const prepared = prepareGroupPlayData(group0, 3001)
				if (!prepared) throw new Error('Prepared is falsy')

				const playData = getGroupPlayData(prepared, 3001)

				expect(playData).toMatchObject({
					groupIsPlaying: true,
					anyPartIsPlaying: true,
					allPartsArePaused: false,
					sectionTimeToEnd: 8899,
					sectionEndTime: 11900,
					sectionEndAction: SectionEndAction.STOP,
				})
				expect(Object.keys(playData.playheads)).toHaveLength(1)
				expect(playData.playheads['partB']).toMatchObject({
					playheadTime: 101,
					partStartTime: 2900,
					partPauseTime: undefined,
					partEndTime: 4900,
					partDuration: 2000,
					partId: 'partB',
					endAction: PlayPartEndAction.NEXT_PART,
					fromSchedule: false,
				})
				expect(Object.keys(playData.countdowns)).toStrictEqual(['partC', 'partD'])

				// Check that the group would stop playing after a while:
				const playDataLater = getGroupPlayData(prepared, 11901)
				expect(Object.keys(playDataLater.playheads)).toHaveLength(0)
				expect(Object.keys(playDataLater.countdowns)).toHaveLength(0)
			}

			// Now stop the part:
			RundownActions.stopPart(group0, 'partB', 3500)
			postProcessGroup(group0, 3500)
			{
				const prepared = prepareGroupPlayData(group0, 3501)
				if (!prepared) throw new Error('Prepared is falsy')

				const playData = getGroupPlayData(prepared, 3501)
				expect(playData).toMatchObject({
					groupIsPlaying: false,
					anyPartIsPlaying: false,
					// allPartsArePaused: true,
					sectionTimeToEnd: null,
					sectionEndTime: null,
					sectionEndAction: null,
				})
				expect(Object.keys(playData.playheads)).toHaveLength(0)
			}
		})
	})

	// Test cases to add:
	// Play (restart) Part A when playing Part A
	// Play Part B when playing Part A
	// Stop Part A when playing Part A

	// Pause Part A when playing Part A
	// Pause (cue) Part B when playing Part A

	// Play infinite part
	// Play looping part

	// Schedule play
})
function getPart(group: Group, partId: string): Part {
	const part = findPartInGroup(group, partId)
	if (!part) throw new Error(`Part "${partId}" not found in group`)
	return part
}
function postProcessGroup(group: Group, now: number) {
	// Update Timeline:
	group.preparedPlayData = prepareGroupPlayData(group, now)
	updateGroupPlayingParts(group, now)
}
function getCommonGroup(): Group {
	return {
		...getDefaultGroup(),
		id: 'group0',
		name: 'Group 0',
		parts: [
			{
				...getDefaultPart(),
				id: 'partA',
				name: 'Part A',
				resolved: {
					duration: 1000,
					label: 'Part A',
				},
			},
			{
				...getDefaultPart(),
				id: 'partB',
				name: 'Part B',
				resolved: {
					duration: 2000,
					label: 'Part B',
				},
			},
			{
				...getDefaultPart(),
				id: 'partC',
				name: 'Part C',
				resolved: {
					duration: 3000,
					label: 'Part C',
				},
			},
			{
				...getDefaultPart(),
				id: 'partD',
				name: 'Part D',
				resolved: {
					duration: 4000,
					label: 'Part D',
				},
			},
		],
	}
}
