import {
	formatDuration,
	parseDuration,
	dateTimeAdvance,
	dateTimeObject,
	repeatTime,
	RepeatingType,
	parseDateTime,
	updateDateTimeObject,
} from '../timeLib'

test('formatDurationLabeled', () => {
	expect(parseDuration('')).toBe(null)
	expect(parseDuration('')).toBe(null)
	expect(parseDuration('∞')).toBe(null)
	expect(parseDuration('asdf')).toBe(undefined)
	expect(parseDuration('00:00:00.000')).toBe(0)
	expect(parseDuration('1')).toBe(1000)
	expect(parseDuration('12')).toBe(12000)
	expect(parseDuration('123')).toBe(1 * 60000 + 23 * 1000)
	expect(parseDuration('1234')).toBe(12 * 60000 + 34 * 1000)
	expect(parseDuration('1234,5')).toBe(12 * 60000 + 34 * 1000 + 500)
	expect(parseDuration('12345')).toBe(1 * 3600000 + 23 * 60000 + 45 * 1000)
	expect(parseDuration('123456')).toBe(12 * 3600000 + 34 * 60000 + 56 * 1000)
	expect(parseDuration('0:23')).toBe(23000)
	expect(parseDuration('00:00:23')).toBe(23000)
	expect(parseDuration('1:23')).toBe(83000)
	expect(parseDuration('01:23')).toBe(83000)
	expect(parseDuration('01:23')).toBe(83000)
	expect(parseDuration('123')).toBe(83000)
	expect(parseDuration('123.5')).toBe(83500)
	expect(parseDuration('1:00:01')).toBe(3601000)
	expect(parseDuration('1:01:01')).toBe(3661000)
	expect(parseDuration('10101')).toBe(3661000)
	expect(parseDuration('0.5')).toBe(500)
	expect(parseDuration('0,12')).toBe(120)
	expect(parseDuration('0.5')).toBe(500)
	expect(parseDuration(',12')).toBe(120)

	// Special cases that happen when user adds numbers at the end while typing:
	expect(parseDuration('∞1')).toBe(1000)
	expect(parseDuration('1:234')).toBe(12 * 60000 + 34 * 1000) // 12:34
	expect(parseDuration('12:345')).toBe(1 * 3600000 + 23 * 60000 + 45 * 1000) // 1:23:45
	expect(parseDuration('1:23:456')).toBe(12 * 3600000 + 34 * 60000 + 56 * 1000) // 12:34:56
	expect(parseDuration('1:16:3', true)).toBe(undefined) // because while writing it would become 11:63 -> 12:03

	// Special cases that happen when user adds numbers at the beginning while typing:
	expect(parseDuration('1∞')).toBe(1000)
	expect(parseDuration('123:45')).toBe(1 * 3600000 + 23 * 60000 + 45 * 1000) // 1:23:34
	expect(parseDuration('1234:56')).toBe(12 * 3600000 + 34 * 60000 + 56 * 1000) // 12:34:56

	// Special cases that happen when user removes the last number while typing:
	expect(parseDuration('1:2')).toBe(12 * 1000) // 12
	expect(parseDuration('12:3')).toBe(1 * 60000 + 23 * 1000) // 1:23
	expect(parseDuration('1:23:4')).toBe(12 * 60000 + 34 * 1000) // 12:34
	expect(parseDuration('12:34:5')).toBe(1 * 3600000 + 23 * 60000 + 45 * 1000) // 1:23:45

	// Special cases that happen when user removes the 2 last numbers while typing:
	expect(parseDuration('1:')).toBe(1 * 1000) // 1
	expect(parseDuration('12:')).toBe(12 * 1000) // 12
	expect(parseDuration('1:23:')).toBe(1 * 60000 + 23 * 1000) // 1:23
	expect(parseDuration('12:34:')).toBe(12 * 60000 + 34 * 1000) // 12:34

	// Special cases that happen when user removes the first number while typing:
	expect(parseDuration('2')).toBe(2 * 1000) // 2
	expect(parseDuration(':23')).toBe(23 * 1000) // 23
	expect(parseDuration('2:34')).toBe(2 * 60000 + 34 * 1000) // 2:34
	expect(parseDuration(':23:45')).toBe(23 * 60000 + 45 * 1000) // 23:45
	expect(parseDuration('2:34:56')).toBe(2 * 3600000 + 34 * 60000 + 56 * 1000) // 2:34:56

	// Special cases that happen when user removes the 2 first numbers while typing:
	expect(parseDuration('')).toBe(null) // null
	expect(parseDuration('23')).toBe(23 * 1000) // 23
	expect(parseDuration(':34')).toBe(34 * 1000) // 34
	expect(parseDuration('23:45')).toBe(23 * 60000 + 45 * 1000) // 23:45
	expect(parseDuration(':34:56')).toBe(34 * 60000 + 56 * 1000) // 34:56
})
test('formatDuration', () => {
	expect(formatDuration(1000)).toBe('1')
	expect(formatDuration(1500)).toBe('1.5')
	expect(formatDuration(1050)).toBe('1.05')
	expect(formatDuration(1005)).toBe('1.005')
	expect(formatDuration(61000)).toBe('1:01')
	expect(formatDuration(3661000)).toBe('1:01:01')
	expect(formatDuration(3661500)).toBe('1:01:01.5')
	expect(formatDuration(null)).toBe('∞')

	expect(formatDuration(parseDuration('5'))).toBe('5')
	expect(formatDuration(parseDuration('10'))).toBe('10')
	expect(formatDuration(parseDuration('1:05'))).toBe('1:05')
	expect(formatDuration(parseDuration('1:01:05'))).toBe('1:01:05')
	expect(formatDuration(parseDuration('1:01:01.5'))).toBe('1:01:01.5')

	expect(formatDuration(1234)).toBe('1.234')
	expect(formatDuration(1234, 0)).toBe('1')
	expect(formatDuration(1234, 1)).toBe('1.2')
	expect(formatDuration(1234, 2)).toBe('1.23')
	expect(formatDuration(1234, 3)).toBe('1.234')
	expect(formatDuration(1234, 4)).toBe('1.234')

	expect(formatDuration(-1234, 3)).toBe('-1.234')
	expect(formatDuration(-1234, 2)).toBe('-1.23')
	expect(formatDuration(-1234, 1)).toBe('-1.2')
	expect(formatDuration(-1234, 0)).toBe('-1')

	expect(formatDuration(3661500, 'smart')).toBe('1:01:01')
	expect(formatDuration(3661000, 'smart')).toBe('1:01:01')
	expect(formatDuration(12345, 'smart')).toBe('12.3')
	expect(formatDuration(12000, 'smart')).toBe('12')

	expect(formatDuration(1001, 0, true)).toBe('2')
	expect(formatDuration(1000, 0, true)).toBe('1')
	expect(formatDuration(999, 0, true)).toBe('1')
	expect(formatDuration(1, 0, true)).toBe('1')
	expect(formatDuration(0, 0, true)).toBe('0')
	expect(formatDuration(-1, 0, true)).toBe('0')
	expect(formatDuration(-1543, 0, true)).toBe('-1')
	expect(formatDuration(-1543, 1, true)).toBe('-1.5')
	expect(formatDuration(-1543, 2, true)).toBe('-1.54')
	expect(formatDuration(-1543, 3, true)).toBe('-1.543')

	expect(formatDuration(1001, 1, true)).toBe('1.1')
	expect(formatDuration(1000, 1, true)).toBe('1.0')
	expect(formatDuration(999, 1, true)).toBe('1.0')
	expect(formatDuration(1, 1, true)).toBe('0.1')
	expect(formatDuration(0, 1, true)).toBe('0.0')

	expect(formatDuration(1001, 2, true)).toBe('1.01')
	expect(formatDuration(1000, 2, true)).toBe('1.00')
	expect(formatDuration(999, 2, true)).toBe('1.00')
	expect(formatDuration(1, 2, true)).toBe('0.01')
	expect(formatDuration(0, 2, true)).toBe('0.00')
})

test('dateTimeAdvance', () => {
	// Notes:
	// * new Date('2022-10-29 12:00:00') is daylight saving time
	// * new Date('2022-10-30 12:00:00') is not daylight saving time

	expect(dateTimeAdvance(strDate('2022-07-05 18:00:00'), { date: 1 })).toStrictEqual(strDate('2022-07-06 18:00:00'))
	expect(dateTimeAdvance(strDate('2022-07-31 18:00:00'), { date: 1 })).toStrictEqual(strDate('2022-08-01 18:00:00'))
	expect(dateTimeAdvance(strDate('2022-12-31 18:00:00'), { date: 1 })).toStrictEqual(strDate('2023-01-01 18:00:00'))
	expect(dateTimeAdvance(strDate('2022-10-29 18:00:00'), { date: 1 })).toStrictEqual(strDate('2022-10-30 18:00:00'))

	expect(dateTimeAdvance(strDate('2020-01-05 18:00:00'), { date: 365 })).toStrictEqual(strDate('2021-01-04 18:00:00')) // 2020 is a leap year

	expect(dateTimeAdvance(strDate('2022-07-05 18:00:00'), { month: 1 })).toStrictEqual(strDate('2022-08-05 18:00:00'))
	expect(dateTimeAdvance(strDate('2022-07-31 18:00:00'), { month: 1 })).toStrictEqual(strDate('2022-08-31 18:00:00'))
	expect(dateTimeAdvance(strDate('2022-08-31 18:00:00'), { month: 1 })).toBe(null) // because 2022-09-31 doesn't exist
	expect(dateTimeAdvance(strDate('2022-12-31 18:00:00'), { month: 1 })).toStrictEqual(strDate('2023-01-31 18:00:00'))
	expect(dateTimeAdvance(strDate('2022-10-29 18:00:00'), { month: 1 })).toStrictEqual(strDate('2022-11-29 18:00:00'))

	expect(dateTimeAdvance(strDate('2020-01-05 18:00:00'), { month: 12 })).toStrictEqual(strDate('2021-01-05 18:00:00')) // even though 2020 is a leap year, the date should be kept the same.
})
test('repeatTime', () => {
	expect(
		repeatTime(
			strDate('2022-07-20 18:00:00'),
			{
				type: RepeatingType.NO_REPEAT,
			},
			{
				now: strTime('2022-07-20 17:01:23'),
				end: strTime('2022-07-21 17:00:00'),
				maxCount: 999,
			}
		).startTimes
	).toStrictEqual([strTime('2022-07-20 18:00:00')])
	expect(
		repeatTime(
			strDate('2022-07-19 18:00:00'),
			{
				type: RepeatingType.CUSTOM,
				intervalCustom: 60 * 60 * 1000,
				repeatUntil: strDate('2022-07-21 6:00:00'),
			},
			{
				now: strTime('2022-07-20 18:01:23'),
				end: strTime('2022-07-21 17:00:00'),
				maxCount: 999,
			}
		).startTimes
	).toStrictEqual([
		strTime('2022-07-20 17:00:00'),
		strTime('2022-07-20 18:00:00'),
		strTime('2022-07-20 19:00:00'),
		strTime('2022-07-20 20:00:00'),
		strTime('2022-07-20 21:00:00'),
		strTime('2022-07-20 22:00:00'),
		strTime('2022-07-20 23:00:00'),
		strTime('2022-07-21 0:00:00'),
		strTime('2022-07-21 1:00:00'),
		strTime('2022-07-21 2:00:00'),
		strTime('2022-07-21 3:00:00'),
		strTime('2022-07-21 4:00:00'),
		strTime('2022-07-21 5:00:00'),
		strTime('2022-07-21 6:00:00'),
	])
	expect(
		repeatTime(
			strDate('2022-07-20 18:00:00'),
			{
				type: RepeatingType.CUSTOM,
				intervalCustom: 60 * 60 * 1000,
				repeatUntil: strDate('2022-07-21 6:00:00'),
			},
			{
				now: strTime('2022-07-20 17:01:23'),
				end: strTime('2022-07-20 20:00:00'),
				maxCount: 999,
			}
		).startTimes
	).toStrictEqual([strTime('2022-07-20 18:00:00'), strTime('2022-07-20 19:00:00'), strTime('2022-07-20 20:00:00')])
	expect(
		repeatTime(
			strDate('2022-07-15 18:00:00'),
			{
				type: RepeatingType.DAILY,
				interval: 1,
				repeatUntil: strDate('2022-07-25 18:00:00'),
			},
			{
				now: strTime('2022-07-20 19:01:23'),
				end: strTime('2022-07-31 18:00:00'),
				maxCount: 999,
			}
		).startTimes
	).toStrictEqual([
		strTime('2022-07-20 18:00:00'),
		strTime('2022-07-21 18:00:00'),
		strTime('2022-07-22 18:00:00'),
		strTime('2022-07-23 18:00:00'),
		strTime('2022-07-24 18:00:00'),
		strTime('2022-07-25 18:00:00'),
	])
	expect(
		repeatTime(
			strDate('2022-10-29 18:00:00'),
			{
				type: RepeatingType.DAILY,
				interval: 2,
				repeatUntil: strDate('2022-11-05 18:00:00'),
			},
			{
				now: strTime('2022-10-29 18:01:23'),
				end: strTime('2022-12-31 23:59:59'),
				maxCount: 999,
			}
		).startTimes
	).toStrictEqual([
		strTime('2022-10-29 18:00:00'),
		strTime('2022-10-31 18:00:00'),
		strTime('2022-11-02 18:00:00'),
		strTime('2022-11-04 18:00:00'),
	])
	expect(
		repeatTime(
			strDate('2022-10-29 18:00:00'),
			{
				type: RepeatingType.DAILY,
				interval: 2,
				repeatUntil: undefined,
			},
			{
				now: strTime('2022-11-05 18:01:23'),
				end: strTime('2022-11-11 23:59:59'),
				maxCount: 999,
			}
		).startTimes
	).toStrictEqual([
		strTime('2022-11-04 18:00:00'),
		strTime('2022-11-06 18:00:00'),
		strTime('2022-11-08 18:00:00'),
		strTime('2022-11-10 18:00:00'),
	])
	expect(
		repeatTime(
			strDate('2022-07-31 18:00:00'),
			{
				type: RepeatingType.MONTHLY,
				interval: 1,
				repeatUntil: strDate('2023-02-15 18:00:00'),
			},
			{
				now: strTime('2022-07-20 19:01:23'),
				end: strTime('2023-07-31 18:00:00'),
				maxCount: 999,
			}
		).startTimes
	).toStrictEqual([
		strTime('2022-07-31 18:00:00'),
		strTime('2022-08-31 18:00:00'),
		// strTime('2022-09-31 18:00:00'), // Doesn't exist
		strTime('2022-10-31 18:00:00'),
		// strTime('2022-11-31 18:00:00'), // Doesn't exist
		strTime('2022-12-31 18:00:00'),
		strTime('2023-01-31 18:00:00'),
	])
	expect(
		repeatTime(
			strDate('2022-10-15 18:00:00'),
			{
				type: RepeatingType.MONTHLY,
				interval: 2,
				repeatUntil: strDate('2023-12-12 23:59:59'),
			},
			{
				now: strTime('2022-10-15 18:01:23'),
				end: strTime('2023-05-31 18:00:00'),
				maxCount: 999,
			}
		).startTimes
	).toStrictEqual([
		strTime('2022-10-15 18:00:00'),
		strTime('2022-12-15 18:00:00'),
		strTime('2023-02-15 18:00:00'),
		strTime('2023-04-15 18:00:00'),
	])
	expect(
		repeatTime(
			strDate('2022-10-15 18:00:00'),
			{
				type: RepeatingType.MONTHLY,
				interval: 2,
				repeatUntil: undefined,
			},
			{
				now: strTime('2023-03-15 18:01:23'),
				end: strTime('2023-05-31 18:00:00'),
				maxCount: 999,
			}
		).startTimes
	).toStrictEqual([strTime('2023-02-15 18:00:00'), strTime('2023-04-15 18:00:00')])
	expect(
		repeatTime(
			strDate('2022-10-12 18:00:00'), // A wednesday
			{
				type: RepeatingType.WEEKLY,
				repeatUntil: undefined,
				weekdays: [
					true, // sunday
					false,
					false,
					true, // wednesday
					false,
					true, // friday
					false,
				],
			},
			{
				now: strTime('2022-10-12 18:12:34'),
				end: strTime('2022-10-21 18:00:00'),
				maxCount: 999,
			}
		).startTimes
	).toStrictEqual([
		strTime('2022-10-12 18:00:00'), // wed
		strTime('2022-10-14 18:00:00'), // fri
		strTime('2022-10-16 18:00:00'), // sun
		strTime('2022-10-19 18:00:00'), // wed
		strTime('2022-10-21 18:00:00'), // fri
	])
	expect(
		repeatTime(
			strDate('2022-10-12 18:00:00'), // A wednesday
			{
				type: RepeatingType.WEEKLY,
				repeatUntil: undefined,
				weekdays: [
					true, // sunday
					false,
					false,
					true, // wednesday
					false,
					true, // friday
					false,
				],
			},
			{
				now: strTime('2022-10-21 18:12:34'),
				end: strTime('2022-10-27 18:00:00'),
				maxCount: 999,
			}
		).startTimes
	).toStrictEqual([
		strTime('2022-10-21 18:00:00'), // fri
		strTime('2022-10-23 18:00:00'), // sun
		strTime('2022-10-26 18:00:00'), // wed
	])
	expect(
		repeatTime(
			strDate('2022-10-12 18:00:00'), // A wednesday
			{
				type: RepeatingType.WEEKLY,
				repeatUntil: strDate('2022-11-31 18:00:00'),
				weekdays: [
					false,
					true, // monday
					false,
					false,
					false,
					false,
					false,
				],
			},
			{
				now: strTime('2022-10-30 18:12:34'),
				end: strTime('2022-12-31 18:00:00'),
				maxCount: 999,
			}
		).startTimes
	).toStrictEqual([
		strTime('2022-10-24 18:00:00'), // mon
		strTime('2022-10-31 18:00:00'), // mon
		strTime('2022-11-07 18:00:00'), // mon
		strTime('2022-11-14 18:00:00'), // mon
		strTime('2022-11-21 18:00:00'), // mon
		strTime('2022-11-28 18:00:00'), // mon
	])

	expect(
		repeatTime(
			strDate('2022-10-12 09:00:00'), // A wednesday
			{
				type: RepeatingType.WEEKLY,
				repeatUntil: strDate('2022-11-05 18:00:00'),
				weekdays: [
					false,
					false,
					false,
					true, // wednesday
					false,
					false,
					false,
				],
			},
			{
				now: strTime('2022-10-12 08:12:34'),
				end: strTime('2022-12-31 18:00:00'),
				maxCount: 999,
			}
		).startTimes
	).toStrictEqual([
		strTime('2022-10-12 09:00:00'), // wed
		strTime('2022-10-19 09:00:00'), // wed
		strTime('2022-10-26 09:00:00'), // wed
		strTime('2022-11-02 09:00:00'), // wed
	])
})
test('parseDateTime', () => {
	const today = new Date()
	const todaysDate = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`

	expect(parseDateTime('2022-11-28 18:00:00')).toStrictEqual(dateTimeObject(new Date('2022-11-28 18:00:00')))
	expect(parseDateTime('2022-01-01 18:00:00')).toStrictEqual(dateTimeObject(new Date('2022-01-01 18:00:00')))
	expect(parseDateTime('2022-11-28 18:00:00')).toStrictEqual(parseDateTime('2022-11-28 18:00:00'))
	expect(parseDateTime('2022-11-28 18:00:-1')).toStrictEqual(parseDateTime('2022-11-28 17:59:59'))
	expect(parseDateTime('2022-11-28 18:-1:00')).toStrictEqual(parseDateTime('2022-11-28 17:59:00'))
	expect(parseDateTime('2022-11-28 -1:00:00')).toStrictEqual(parseDateTime('2022-11-27 23:00:00'))
	expect(parseDateTime('2022-11-00 18:00:00')).toStrictEqual(parseDateTime('2022-10-31 18:00:00'))
	expect(parseDateTime('2022-11--1 18:00:00')).toStrictEqual(parseDateTime('2022-10-30 18:00:00'))
	expect(parseDateTime('2022-00-28 18:00:00')).toStrictEqual(parseDateTime('2021-12-28 18:00:00'))
	expect(parseDateTime('2022--1-28 18:00:00')).toStrictEqual(parseDateTime('2021-11-28 18:00:00'))

	expect(parseDateTime('800')).toStrictEqual(dateTimeObject(new Date(`${todaysDate} 08:00:00`)))
	expect(parseDateTime('8:00:00')).toStrictEqual(dateTimeObject(new Date(`${todaysDate} 08:00:00`)))
	expect(parseDateTime('94518')).toStrictEqual(dateTimeObject(new Date(`${todaysDate} 09:45:18`)))
	expect(parseDateTime('9:45:18')).toStrictEqual(dateTimeObject(new Date(`${todaysDate} 09:45:18`)))
	expect(parseDateTime('16')).toStrictEqual(dateTimeObject(new Date(`${todaysDate} 16:00:00`)))
	expect(parseDateTime('16:00')).toStrictEqual(dateTimeObject(new Date(`${todaysDate} 16:00:00`)))
	expect(parseDateTime('2023')).toStrictEqual(dateTimeObject(new Date(`${todaysDate} 20:23:00`)))
	expect(parseDateTime('2022-08-30')).toStrictEqual(dateTimeObject(new Date(`2022-08-30 00:00:00`)))
	expect(parseDateTime('2022-08-30 8:30:14')).toStrictEqual(dateTimeObject(new Date(`2022-08-30 08:30:14`)))
	expect(parseDateTime('2022-08-30 8:30')).toStrictEqual(dateTimeObject(new Date(`2022-08-30 08:30:00`)))
	expect(parseDateTime('2022-08-30 830')).toStrictEqual(dateTimeObject(new Date(`2022-08-30 08:30:00`)))
	expect(parseDateTime('2022-08-30 8')).toStrictEqual(dateTimeObject(new Date(`2022-08-30 08:00:00`)))
})
test('updateDateTimeObject', () => {
	{
		// No change
		const d = strDate('2022-08-30 1:23:45')
		const dOrg = { ...d }
		updateDateTimeObject(d)
		expect(d).toStrictEqual(dOrg)
	}
	{
		// bad unix timestamp
		const d = strDate('2022-08-30 1:23:45')
		const dOrg = { ...d }
		d.unixTimestamp = 1234
		updateDateTimeObject(d)
		expect(d).toStrictEqual(dOrg) // expect unixTimestamp to have been corrected
	}
	{
		// bad weekday
		const d = strDate('2022-08-30 1:23:45')
		const dOrg = { ...d }
		d.weekDay = -1
		updateDateTimeObject(d)
		expect(d).toStrictEqual(dOrg) // expect weekDay to have been corrected
	}
})
function strTime(str: string) {
	return new Date(str).getTime()
}
function strDate(str: string) {
	return dateTimeObject(new Date(str))
}
