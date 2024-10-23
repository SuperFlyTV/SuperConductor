import { prepareGroupPlayData } from '../preparedGroupPlayData.js'
import { getDefaultGroup, getDefaultPart } from '../../defaults.js'
import { Group } from '../../../models/rundown/Group.js'
import * as RundownActions from '../../../electron/rundownActions.js'
import { findPartInGroup, updateGroupPlayingParts } from '../../util.js'
import { Part } from '../../../models/rundown/Part.js'
import { getGroupPlayData } from '../groupPlayData.js'
import { PlayPartEndAction, SectionEndAction } from '../../../models/GUI/PreparedPlayhead.js'

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

				expect(prepared.sections).toMatchObject([
					{
						startTime: 1000,
						pauseTime: undefined,
						stopTime: undefined,
						endTime: 2000,
						duration: 1000,
						// repeating?: boolean,
						schedule: false,
						endAction: SectionEndAction.STOP,
					},
				])

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

				expect(prepared.sections).toMatchObject([
					{
						startTime: 2900,
						pauseTime: undefined,
						stopTime: 3500,
						endTime: 3500,
						duration: 1000,
						schedule: false,
						endAction: SectionEndAction.STOP,
					},
				])

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

				expect(prepared.sections).toMatchObject([
					{
						startTime: 1000,
						pauseTime: undefined,
						stopTime: undefined,
						endTime: 1000,
						duration: 0,
						schedule: false,
						endAction: SectionEndAction.NEXT_SECTION,
					},
					{
						startTime: 1000,
						pauseTime: undefined,
						stopTime: undefined,
						endTime: null,
						duration: 1000,
						repeating: true,
						schedule: false,
						endAction: SectionEndAction.LOOP_SELF,
					},
				])

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

				expect(prepared.sections).toMatchObject([
					{
						startTime: 1000,
						pauseTime: undefined,
						stopTime: 1500,
						endTime: 1000,
						duration: 0,
						schedule: false,
						endAction: SectionEndAction.NEXT_SECTION,
					},
					{
						startTime: 1000,
						pauseTime: undefined,
						stopTime: 1500,
						endTime: 1500,
						duration: 1000,
						repeating: true,
						schedule: false,
						endAction: SectionEndAction.STOP,
					},
				])

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
		test('Play infinite Part B when stopped', () => {
			const group0 = getTestGroup()
			expect(group0.oneAtATime).toBeTruthy()

			const part = getPart(group0, 'partB')
			// Set the part to be infinite:
			part.resolved.duration = null

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
					sectionTimeToEnd: null,
					sectionEndTime: null,
					sectionEndAction: SectionEndAction.INFINITE,
				})
				expect(Object.keys(playData.playheads)).toHaveLength(1)
				expect(playData.playheads['partB']).toMatchObject({
					playheadTime: 1,
					partStartTime: 1000,
					partPauseTime: undefined,
					partEndTime: null,
					partDuration: null,
					partId: 'partB',
					fromSchedule: false,
				})
				expect(Object.keys(playData.countdowns)).toHaveLength(0)

				expect(playData).toMatchSnapshot()

				// Ensure it is still playing long after:
				{
					const playData = getGroupPlayData(prepared, 900000)
					expect(playData.playheads['partB']).toMatchObject({
						playheadTime: 899000,
						partStartTime: 1000,
						partPauseTime: undefined,
						partEndTime: null,
						partDuration: null,
						partId: 'partB',
						fromSchedule: false,
					})
				}
			}

			// Now stop the part:
			RundownActions.stopPart(group0, 'partB', 9000)
			postProcessGroup(group0, 9000)
			{
				const prepared = prepareGroupPlayData(group0, 9000)
				if (!prepared) throw new Error('Prepared is falsy')
				expect(prepared).toMatchSnapshot()

				const playData = getGroupPlayData(prepared, 9001)
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
		test('Play looping Part B, then stop it after loop', () => {
			const group0 = getTestGroup()
			expect(group0.oneAtATime).toBeTruthy()

			const part = getPart(group0, 'partB')
			part.loop = true

			// Play the part:
			RundownActions.playPart(group0, part, 1000)
			postProcessGroup(group0, 1000)

			{
				const prepared = prepareGroupPlayData(group0, 1001)
				if (!prepared) throw new Error('Prepared is falsy')

				{
					const playData = getGroupPlayData(prepared, 1001)

					expect(playData).toMatchObject({
						groupIsPlaying: true,
						anyPartIsPlaying: true,
						allPartsArePaused: false,
						sectionTimeToEnd: 1999,
						sectionEndTime: 3000,
						sectionEndAction: SectionEndAction.LOOP_SELF,
					})
					expect(Object.keys(playData.playheads)).toHaveLength(1)
					expect(playData.playheads['partB']).toMatchObject({
						playheadTime: 1,
						partStartTime: 1000,
						partPauseTime: undefined,
						partEndTime: 3000,
						partDuration: 2000,
						partId: 'partB',
						endAction: PlayPartEndAction.LOOP_SELF,
						fromSchedule: false,
					})
					expect(Object.keys(playData.countdowns)).toStrictEqual(['partB'])
				}
				// Also check after a loop:
				{
					const playData = getGroupPlayData(prepared, 3500)

					expect(playData).toMatchObject({
						groupIsPlaying: true,
						anyPartIsPlaying: true,
						allPartsArePaused: false,
						sectionTimeToEnd: 1500,
						sectionEndTime: 5000,
						sectionEndAction: SectionEndAction.LOOP_SELF,
					})
					expect(Object.keys(playData.playheads)).toHaveLength(1)
					expect(playData.playheads['partB']).toMatchObject({
						playheadTime: 500,
						partStartTime: 3000,
						partPauseTime: undefined,
						partEndTime: 5000,
						partDuration: 2000,
						partId: 'partB',
						endAction: PlayPartEndAction.LOOP_SELF,
						fromSchedule: false,
					})
					expect(Object.keys(playData.countdowns)).toStrictEqual(['partB'])
				}
			}

			// Wait for the part to loop (at 3000),
			// then stop the part:
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
				expect(Object.keys(playData.countdowns)).toHaveLength(0)
			}
		})
		test('When Group and Part A are looping, return all the way to Part A', () => {
			const group0 = getTestGroup()
			expect(group0.oneAtATime).toBeTruthy()
			group0.loop = true

			const partA = getPart(group0, 'partA')
			partA.loop = true

			const partB = getPart(group0, 'partB')

			// Play Part B:
			RundownActions.playPart(group0, partB, 1000)
			postProcessGroup(group0, 1000)

			{
				const prepared = prepareGroupPlayData(group0, 1001)
				if (!prepared) throw new Error('Prepared is falsy')

				{
					const playData = getGroupPlayData(prepared, 1001)

					expect(playData).toMatchObject({
						groupIsPlaying: true,
						anyPartIsPlaying: true,
						allPartsArePaused: false,
						sectionTimeToEnd: 8999,
						sectionEndTime: 10000,
						sectionEndAction: SectionEndAction.NEXT_SECTION,
					})
				}
				// Check that After B, C and D, it goes back to A:
				{
					const playData = getGroupPlayData(prepared, 10001)

					expect(playData).toMatchObject({
						groupIsPlaying: true,
						anyPartIsPlaying: true,
						allPartsArePaused: false,
						sectionTimeToEnd: 999,
						sectionEndTime: 11000,
						sectionEndAction: SectionEndAction.LOOP_SELF,
					})
					expect(Object.keys(playData.playheads)).toHaveLength(1)
					expect(playData.playheads['partA']).toMatchObject({
						playheadTime: 1,
						partStartTime: 10000,
						partPauseTime: undefined,
						partEndTime: 11000,
						partDuration: 1000,
						partId: 'partA',
						endAction: PlayPartEndAction.LOOP_SELF,
						fromSchedule: false,
					})
					expect(Object.keys(playData.countdowns)).toStrictEqual(['partA'])
				}
			}
		})
		test('When Group and Part B are looping, return all the way to Part B', () => {
			const group0 = getTestGroup()
			expect(group0.oneAtATime).toBeTruthy()
			group0.loop = true

			const partB = getPart(group0, 'partB')
			partB.loop = true

			const partC = getPart(group0, 'partC')

			// Play Part C:
			RundownActions.playPart(group0, partC, 3000)
			postProcessGroup(group0, 3000)

			{
				const prepared = prepareGroupPlayData(group0, 3001)
				if (!prepared) throw new Error('Prepared is falsy')

				{
					const playData = getGroupPlayData(prepared, 3001)

					expect(playData).toMatchObject({
						groupIsPlaying: true,
						anyPartIsPlaying: true,
						allPartsArePaused: false,
						sectionTimeToEnd: 6999,
						sectionEndTime: 10000,
						sectionEndAction: SectionEndAction.NEXT_SECTION,
					})
				}
				// Check that After C and D, it goes go back to A:
				{
					const playData = getGroupPlayData(prepared, 10001)

					expect(playData).toMatchObject({
						groupIsPlaying: true,
						anyPartIsPlaying: true,
						allPartsArePaused: false,
						sectionTimeToEnd: 999,
						sectionEndTime: 11000,
						sectionEndAction: SectionEndAction.NEXT_SECTION,
					})
					expect(Object.keys(playData.playheads)).toHaveLength(1)
					expect(playData.playheads['partA']).toMatchObject({
						playheadTime: 1,
						partStartTime: 10000,
						partPauseTime: undefined,
						partEndTime: 11000,
						partDuration: 1000,
						partId: 'partA',
						endAction: PlayPartEndAction.NEXT_PART,
						fromSchedule: false,
					})
					expect(Object.keys(playData.countdowns)).toStrictEqual(['partB'])
				}
				// Check that After A, it plays B:
				{
					const playData = getGroupPlayData(prepared, 11001)

					expect(playData).toMatchObject({
						groupIsPlaying: true,
						anyPartIsPlaying: true,
						allPartsArePaused: false,
						sectionTimeToEnd: 1999,
						sectionEndTime: 13000,
						sectionEndAction: SectionEndAction.LOOP_SELF,
					})
					expect(Object.keys(playData.playheads)).toHaveLength(1)
					expect(playData.playheads['partB']).toMatchObject({
						playheadTime: 1,
						partStartTime: 11000,
						partPauseTime: undefined,
						partEndTime: 13000,
						partDuration: 2000,
						partId: 'partB',
						endAction: PlayPartEndAction.LOOP_SELF,
						fromSchedule: false,
					})
					expect(Object.keys(playData.countdowns)).toStrictEqual(['partB'])
				}
			}
		})
		test('Group with looping, w/o autoPlay, stops after first started Part', () => {
			const group0 = getTestGroup()
			expect(group0.oneAtATime).toBeTruthy()
			group0.autoPlay = false
			group0.loop = true

			const partB = getPart(group0, 'partB')

			// Play Part B:
			RundownActions.playPart(group0, partB, 1000)
			postProcessGroup(group0, 1000)

			{
				const prepared = prepareGroupPlayData(group0, 1001)
				if (!prepared) throw new Error('Prepared is falsy')

				expect(prepared.sections.length).toBe(1)
				{
					const playData = getGroupPlayData(prepared, 1001)

					expect(playData).toMatchObject({
						groupIsPlaying: true,
						anyPartIsPlaying: true,
						allPartsArePaused: false,
						sectionTimeToEnd: 1999,
						sectionEndTime: 3000,
						sectionEndAction: SectionEndAction.STOP,
					})
				}
			}
		})
		test('Play, when Part B is infinite', () => {
			const group0 = getTestGroup()
			expect(group0.oneAtATime).toBeTruthy()

			const partA = getPart(group0, 'partA')
			const partB = getPart(group0, 'partB')

			// Set part B to be infinite:
			partB.resolved.duration = null

			// Play part A:
			RundownActions.playPart(group0, partA, 1000)
			postProcessGroup(group0, 1000)

			{
				const prepared = prepareGroupPlayData(group0, 1001)
				if (!prepared) throw new Error('Prepared is falsy')

				const playData = getGroupPlayData(prepared, 1001)

				expect(playData).toMatchObject({
					groupIsPlaying: true,
					anyPartIsPlaying: true,
					allPartsArePaused: false,
					sectionTimeToEnd: null,
					sectionEndTime: null,
					sectionEndAction: SectionEndAction.INFINITE,
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
				expect(Object.keys(playData.countdowns)).toStrictEqual(['partB'])
			}
			{
				const prepared = prepareGroupPlayData(group0, 3500)
				if (!prepared) throw new Error('Prepared is falsy')

				const playData = getGroupPlayData(prepared, 3501)

				expect(playData).toMatchObject({
					groupIsPlaying: true,
					anyPartIsPlaying: true,
					allPartsArePaused: false,
					sectionTimeToEnd: null,
					sectionEndTime: null,
					sectionEndAction: SectionEndAction.INFINITE,
				})
				expect(Object.keys(playData.playheads)).toHaveLength(1)
				expect(playData.playheads['partB']).toMatchObject({
					playheadTime: 1501,
					partStartTime: 2000,
					partPauseTime: undefined,
					partEndTime: null,
					partDuration: null,
					partId: 'partB',
					endAction: PlayPartEndAction.INFINITE,
					fromSchedule: false,
				})
				expect(Object.keys(playData.countdowns)).toHaveLength(0)
			}
		})
	})

	describe('Multi-play Group', () => {
		// Tests a Group set as a playlist
		function getTestGroup(): Group {
			const group = getCommonGroup()
			group.oneAtATime = false
			group.autoPlay = false
			group.loop = false
			return group
		}
		test('Play Part A, then B', () => {
			const group0 = getTestGroup()
			expect(group0.oneAtATime).toBeFalsy()

			const partA = getPart(group0, 'partA')
			const partB = getPart(group0, 'partB')

			// Play part A:
			RundownActions.playPart(group0, partA, 1000)
			postProcessGroup(group0, 1000)
			{
				const prepared = prepareGroupPlayData(group0, 1001)
				if (!prepared) throw new Error('Prepared is falsy')
				expect(prepared).toMatchSnapshot()

				expect(prepared).toMatchObject({
					type: 'multi',
				})
				expect(Object.keys(prepared.sections)).toStrictEqual(['partA'])

				const playData = getGroupPlayData(prepared, 1001)

				expect(playData).toMatchObject({
					groupIsPlaying: false,
					anyPartIsPlaying: true,
					allPartsArePaused: false,
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
			// Play part B:
			RundownActions.playPart(group0, partB, 1500)
			postProcessGroup(group0, 1500)
			{
				const prepared = prepareGroupPlayData(group0, 1503)
				if (!prepared) throw new Error('Prepared is falsy')
				expect(prepared).toMatchSnapshot()

				expect(Object.keys(prepared.sections)).toStrictEqual(['partA', 'partB'])

				const playData = getGroupPlayData(prepared, 1503)

				expect(playData).toMatchObject({
					groupIsPlaying: false,
					anyPartIsPlaying: true,
					allPartsArePaused: false,
				})
				expect(Object.keys(playData.playheads)).toHaveLength(2)
				expect(playData.playheads['partA']).toMatchObject({
					playheadTime: 503,
					partStartTime: 1000,
					partPauseTime: undefined,
					partEndTime: 2000,
					partDuration: 1000,
					partId: 'partA',
					endAction: PlayPartEndAction.STOP,
					fromSchedule: false,
				})
				expect(playData.playheads['partB']).toMatchObject({
					playheadTime: 3,
					partStartTime: 1500,
					partPauseTime: undefined,
					partEndTime: 3500,
					partDuration: 2000,
					partId: 'partB',
					endAction: PlayPartEndAction.STOP,
					fromSchedule: false,
				})
				expect(Object.keys(playData.countdowns)).toHaveLength(0)
				expect(playData).toMatchSnapshot()

				{
					// Check that A stops playing after a while:
					const playDataLater = getGroupPlayData(prepared, 2001)
					expect(Object.keys(playDataLater.playheads)).toHaveLength(1)
					expect(Object.keys(playDataLater.countdowns)).toHaveLength(0)
				}
				{
					// Check that B stops playing after a while:
					const playDataLater = getGroupPlayData(prepared, 3501)
					expect(Object.keys(playDataLater.playheads)).toHaveLength(0)
					expect(Object.keys(playDataLater.countdowns)).toHaveLength(0)
				}
			}
		})
	})

	// Test cases to add:
	// Play (restart) Part A when playing Part A
	// Play Part B when playing Part A
	// Stop Part A when playing Part A

	// Pause Part A when playing Part A
	// Pause (cue) Part B when playing Part A

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
