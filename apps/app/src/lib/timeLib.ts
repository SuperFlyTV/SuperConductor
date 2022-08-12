import { assertNever } from '@shared/lib'
import _ from 'lodash'

export function parseDuration(str: string): number | null | undefined {
	if (str === '') return null
	if (str === '∞') return null
	if (!str) return undefined

	str = str.replace(/,/g, '.')

	{
		const m = str.match(/^(\d{1,2}):(\d{2}):(\d{2})\.(\d{1,3})$/) // hh:mm:ss.xxx
		if (m)
			return parseInt(m[1]) * 3600000 + parseInt(m[2]) * 60000 + parseInt(m[3]) * 1000 + parseMilliseconds(m[4])
	}

	{
		const m = str.match(/^(\d{1,2}):(\d{2})\.(\d{1,3})$/) // mm:ss.xxx
		if (m) return parseInt(m[1]) * 60000 + parseInt(m[2]) * 1000 + parseMilliseconds(m[3])
	}

	{
		const m = str.match(/^(\d{1,2})\.(\d{1,3})$/) // ss.xxx
		if (m) return parseInt(m[1]) * 1000 + parseMilliseconds(m[2])
	}
	{
		const m = str.match(/^\.(\d{1,3})$/) // .xxx
		if (m) return parseMilliseconds(m[1])
	}

	{
		const m = str.match(/^(\d{1,2}):(\d{2}):(\d{2})$/) // hh:mm:ss | hhmmss
		if (m) return parseInt(m[1]) * 3600000 + parseInt(m[2]) * 60000 + parseInt(m[3]) * 1000
	}
	{
		const m = str.match(/^(\d{1,2}):(\d{2})(\d{2})$/) // hh:mmss
		if (m) return parseInt(m[1]) * 3600000 + parseInt(m[2]) * 60000 + parseInt(m[3]) * 1000
	}

	{
		const m = str.match(/^(\d{1,2})(\d{2})(\d{2})$/) // hhmmss
		if (m) return parseInt(m[1]) * 3600000 + parseInt(m[2]) * 60000 + parseInt(m[3]) * 1000
	}

	{
		const m = str.match(/^(\d{1,2}):(\d{2})$/) // mm:ss
		if (m) return parseInt(m[1]) * 60000 + parseInt(m[2]) * 1000
	}

	{
		const m = str.match(/^(\d{1,2})(\d{2})$/) // mmss
		if (m) return parseInt(m[1]) * 60000 + parseInt(m[2]) * 1000
	}
	{
		const m = str.match(/^(\d{1,2})(\d{2})\.(\d{1,3})$/) // mmss.xxx
		if (m) return parseInt(m[1]) * 60000 + parseInt(m[2]) * 1000 + parseMilliseconds(m[3])
	}

	{
		const m = str.match(/^(\d{1,2})$/) // ss
		if (m) return parseInt(m[1]) * 1000
	}

	// Transition-formats (ie these might show up while typing):
	{
		const m = str.match(/^(\d{1,2}):(\d{3,4})$/) // hh:mmxx
		if (m) return parseDuration(m[1] + m[2]) // -> hhmmss
	}
	{
		const m = str.match(/^(\d{1}):(\d{1,2}):(\d{3})$/) // h:mm:ssx
		if (m) return parseDuration(m[1] + m[2] + m[3]) // -> hhmmss
	}
	{
		const m = str.match(/^(\d{1,2}):(\d{1})$/) // s:s or ms:s
		if (m) return parseDuration(m[1] + m[2]) // -> ss or m:ss
	}
	{
		const m = str.match(/^(\d{1,2}):(\d{2}):(\d{1})$/) // m:ms:s or hm:ms:s
		if (m) return parseDuration(m[1] + m[2] + m[3]) // -> mm:ss or h:mm:ss
	}
	{
		const m = str.match(/^(\d{1,2}):$/) // s: or ss:
		if (m) return parseDuration(m[1]) // -> s or ss
	}
	{
		const m = str.match(/^(\d{1,2}):(\d{2}):$/) // m:ss: or mm:ss:
		if (m) return parseDuration(m[1] + m[2]) // -> m:ss or mm:ss
	}
	{
		const m = str.match(/^:(\d{2})$/) // :ss
		if (m) return parseDuration(m[1]) // -> ss
	}
	{
		const m = str.match(/^:(\d{2}):(\d{2})$/) // :mm:ss
		if (m) return parseDuration(m[1] + m[2]) // -> mm:ss
	}
	{
		const m = str.match(/^(\d{3,4}):(\d{2})$/) // hmm:ss or hhmm:ss
		if (m) return parseDuration(m[1] + m[2]) // -> h:mm:ss or hh:mm:ss
	}

	return undefined
}

function assert<T>(val: T, check: T) {
	if (!_.isEqual(val, check))
		throw new Error(`Assertion failed, expected ${JSON.stringify(check)} but got ${JSON.stringify(val)}`)
}
function parseMilliseconds(ms: string): number {
	if (!ms) return 0

	return Math.floor(parseFloat(`0.${ms}`) * 1000)
}
export function millisecondsToTime(ms: number): { h: number; m: number; s: number; ms: number } {
	const h = Math.floor(ms / 3600000)
	ms -= h * 3600000

	const m = Math.floor(ms / 60000)
	ms -= m * 60000

	const s = Math.floor(ms / 1000)
	ms -= s * 1000

	return { h, m, s, ms }
}

export function formatDuration(inputMs: number | null | undefined, decimalCount?: number | 'smart'): string {
	if (inputMs === null) return '∞'
	if (inputMs === undefined) return ''

	const { h, m: min, s: sec, ms } = millisecondsToTime(inputMs)

	let msStr = !ms ? '000' : ms < 10 ? `00${ms}` : ms < 100 ? `0${ms}` : `${ms}` // 001 | 012 | 123

	if (decimalCount === 'smart') {
		decimalCount = inputMs > 60000 ? 0 : 1
	}
	if (decimalCount !== undefined) {
		msStr = msStr.slice(0, decimalCount)
	} else {
		msStr = msStr.replace(/0+$/, '') // trim trailing zeros
	}
	if (msStr) msStr = '.' + msStr

	if (h) return `${h}:${pad(min)}:${pad(sec)}` + msStr
	if (min) return `${min}:${pad(sec)}` + msStr
	return `${sec}` + msStr
}
function pad(n: number, size = 2): string {
	let str = `${n}`
	while (str.length < size) {
		str = '0' + str
	}
	return str
}

export function formatDurationLabeled(inputMs: number | undefined): string {
	if (inputMs === undefined) return ''

	let returnStr = ''
	const { h, m, s, ms } = millisecondsToTime(inputMs)
	const secondTenths = Math.floor(ms / 100)

	if (h) {
		returnStr += `${h}h`
	}
	if (m) {
		returnStr += `${m}m`
	}
	if (s) {
		if (secondTenths) {
			returnStr += `${s}.${secondTenths}s`
		} else {
			returnStr += `${s}s`
		}
	}

	return returnStr
}

// Unit tests:
try {
	assert(parseDuration(''), null)
	assert(parseDuration(''), null)
	assert(parseDuration('∞'), null)
	assert(parseDuration('asdf'), undefined)
	assert(parseDuration('00:00:00.000'), 0)
	assert(parseDuration('1'), 1000)
	assert(parseDuration('12'), 12000)
	assert(parseDuration('123'), 1 * 60000 + 23 * 1000)
	assert(parseDuration('1234'), 12 * 60000 + 34 * 1000)
	assert(parseDuration('1234,5'), 12 * 60000 + 34 * 1000 + 500)
	assert(parseDuration('12345'), 1 * 3600000 + 23 * 60000 + 45 * 1000)
	assert(parseDuration('123456'), 12 * 3600000 + 34 * 60000 + 56 * 1000)
	assert(parseDuration('0:23'), 23000)
	assert(parseDuration('00:00:23'), 23000)
	assert(parseDuration('1:23'), 83000)
	assert(parseDuration('01:23'), 83000)
	assert(parseDuration('01:23'), 83000)
	assert(parseDuration('123'), 83000)
	assert(parseDuration('123.5'), 83500)
	assert(parseDuration('1:00:01'), 3601000)
	assert(parseDuration('1:01:01'), 3661000)
	assert(parseDuration('10101'), 3661000)
	assert(parseDuration('0.5'), 500)
	assert(parseDuration('0,12'), 120)
	assert(parseDuration('0.5'), 500)
	assert(parseDuration(',12'), 120)

	// Special cases that happen when user adds numbers at the end while typing:
	assert(parseDuration('1:234'), 12 * 60000 + 34 * 1000) // 12:34
	assert(parseDuration('12:345'), 1 * 3600000 + 23 * 60000 + 45 * 1000) // 1:23:45
	assert(parseDuration('1:23:456'), 12 * 3600000 + 34 * 60000 + 56 * 1000) // 12:34:56

	// Special cases that happen when user adds numbers at the beginning while typing:
	assert(parseDuration('123:45'), 1 * 3600000 + 23 * 60000 + 45 * 1000) // 1:23:34
	assert(parseDuration('1234:56'), 12 * 3600000 + 34 * 60000 + 56 * 1000) // 12:34:56

	// Special cases that happen when user removes the last number while typing:
	assert(parseDuration('1:2'), 12 * 1000) // 12
	assert(parseDuration('12:3'), 1 * 60000 + 23 * 1000) // 1:23
	assert(parseDuration('1:23:4'), 12 * 60000 + 34 * 1000) // 12:34
	assert(parseDuration('12:34:5'), 1 * 3600000 + 23 * 60000 + 45 * 1000) // 1:23:45

	// Special cases that happen when user removes the 2 last numbers while typing:
	assert(parseDuration('1:'), 1 * 1000) // 1
	assert(parseDuration('12:'), 12 * 1000) // 12
	assert(parseDuration('1:23:'), 1 * 60000 + 23 * 1000) // 1:23
	assert(parseDuration('12:34:'), 12 * 60000 + 34 * 1000) // 12:34

	// Special cases that happen when user removes the first number while typing:
	assert(parseDuration('2'), 2 * 1000) // 2
	assert(parseDuration(':23'), 23 * 1000) // 23
	assert(parseDuration('2:34'), 2 * 60000 + 34 * 1000) // 2:34
	assert(parseDuration(':23:45'), 23 * 60000 + 45 * 1000) // 23:45
	assert(parseDuration('2:34:56'), 2 * 3600000 + 34 * 60000 + 56 * 1000) // 2:34:56

	// Special cases that happen when user removes the 2 first numbers while typing:
	assert(parseDuration(''), null) // null
	assert(parseDuration('23'), 23 * 1000) // 23
	assert(parseDuration(':34'), 34 * 1000) // 34
	assert(parseDuration('23:45'), 23 * 60000 + 45 * 1000) // 23:45
	assert(parseDuration(':34:56'), 34 * 60000 + 56 * 1000) // 34:56

	assert(formatDuration(1000), '1')
	assert(formatDuration(1500), '1.5')
	assert(formatDuration(1050), '1.05')
	assert(formatDuration(1005), '1.005')
	assert(formatDuration(61000), '1:01')
	assert(formatDuration(3661000), '1:01:01')
	assert(formatDuration(3661500), '1:01:01.5')
	assert(formatDuration(null), '∞')

	assert(formatDuration(parseDuration('5')), '5')
	assert(formatDuration(parseDuration('10')), '10')
	assert(formatDuration(parseDuration('1:05')), '1:05')
	assert(formatDuration(parseDuration('1:01:05')), '1:01:05')
	assert(formatDuration(parseDuration('1:01:01.5')), '1:01:01.5')

	assert(formatDuration(1234), '1.234')
	assert(formatDuration(1234, 0), '1')
	assert(formatDuration(1234, 1), '1.2')
	assert(formatDuration(1234, 2), '1.23')
	assert(formatDuration(1234, 4), '1.234')
} catch (e) {
	// eslint-disable-next-line no-console
	console.error(e)
}

// Note: The reason for all these functions is to be able to repeat and keep the same "hour" over daylight saving time.

export interface DateTimeObjectBase {
	year: number
	month: number // 0=january
	date: number
	/** Day of week, 0=sunday*/
	weekDay: number
	hour: number
	minute: number
	second: number
	millisecond: number
}
export interface DateTimeObject extends DateTimeObjectBase {
	unixTimestamp: number
}
export function updateDateTimeObject(d: DateTimeObject): void {
	const date = dateTimeObjectToDate(d)
	const d2 = dateTimeObject(date)

	d.year = d2.year
	d.month = d2.month
	d.date = d2.date
	d.weekDay = d2.weekDay
	d.hour = d2.hour
	d.minute = d2.minute
	d.second = d2.second
	d.millisecond = d2.millisecond
	d.unixTimestamp = d2.unixTimestamp
}

export function dateTimeObjectToDate(d: DateTimeObjectBase): Date {
	// In local time:
	// return new Date(`${d.year}-${d.month + 1}-${d.date} ${d.hour}:${d.minute}:${d.second}.${d.millisecond}`)
	return new Date(d.year, d.month, d.date, d.hour, d.minute, d.second, d.millisecond)
}
export function dateTimeObject(d: Date | number): DateTimeObject {
	const d2 = typeof d === 'number' ? new Date(d) : d
	const dateTime: DateTimeObject = {
		year: d2.getFullYear(),
		month: d2.getMonth(),
		date: d2.getDate(),
		weekDay: d2.getDay(),
		hour: d2.getHours(),
		minute: d2.getMinutes(),
		second: d2.getSeconds(),
		millisecond: d2.getMilliseconds(),
		unixTimestamp: d2.getTime(),
	}
	return dateTime
}
export function dateTimeObjectIsValid(d: DateTimeObjectBase): boolean {
	return !Number.isNaN(dateTimeObjectToDate(d).getTime())
}
function dateTimeAdvance(d: DateTimeObject, a: { date: number } | { month: number }): DateTimeObject | null {
	if (!dateTimeObjectIsValid(d)) {
		throw new Error(`Internal Error: Unable to advance date, invalid start date: ${JSON.stringify(d)}`)
	}

	if ('date' in a) {
		const d2 = dateTimeObjectToDate(d)
		const dNext = new Date(
			d2.getFullYear(),
			d2.getMonth(),
			d2.getDate() + a.date,
			d2.getHours(),
			d2.getMinutes(),
			d2.getSeconds(),
			d2.getMilliseconds()
		)
		return dateTimeObject(dNext)
	} else if ('month' in a) {
		const next = _.clone(d)

		next.month += a.month
		while (next.month >= 12) {
			next.month -= 12
			next.year++
		}
		if (!dateTimeObjectIsValid(next)) {
			return null
		}
		updateDateTimeObject(next)
		if (
			next.date !== d.date // The date has rolled over
		) {
			// This means that there is no such date in the next month (such as 31st of February)
			return null
		}

		return next
	}
	return d
}

export enum RepeatingType {
	NO_REPEAT = 'no_repeat',
	DAILY = 'daily',
	WEEKLY = 'weekly',
	MONTHLY = 'monthly',
	CUSTOM = 'custom',
}
export type RepeatingSettingsAny =
	| RepeatingSettingsNoRepeat
	| RepeatingSettingsDaily
	| RepeatingSettingsWeekly
	| RepeatingSettingsMonthly
	| RepeatingSettingsCustom

export interface RepeatingSettingsBase {
	type: RepeatingType
}
export interface RepeatingSettingsNoRepeat extends RepeatingSettingsBase {
	type: RepeatingType.NO_REPEAT
}
export interface RepeatingSettingsDaily extends RepeatingSettingsBase {
	type: RepeatingType.DAILY
	/** Repeat every X day */
	interval: number | undefined
	/** Stop repeating after this timestamp */
	repeatUntil: DateTimeObject | undefined
}
export interface RepeatingSettingsWeekly extends RepeatingSettingsBase {
	type: RepeatingType.WEEKLY
	/** Which weekdays to repeat on */
	weekdays:
		| [
				boolean, // sunday
				boolean, // monday
				boolean, // tuesday
				boolean, // wednesday
				boolean, // thursday
				boolean, // friday
				boolean // saturday
		  ]
		| undefined
	/** Stop repeating after this timestamp */
	repeatUntil: DateTimeObject | undefined
}
export interface RepeatingSettingsMonthly extends RepeatingSettingsBase {
	type: RepeatingType.MONTHLY
	/** Repeat every X month */
	interval: number | undefined
	/** Stop repeating after this timestamp */
	repeatUntil: DateTimeObject | undefined
}
export interface RepeatingSettingsCustom extends RepeatingSettingsBase {
	type: RepeatingType.CUSTOM
	/** Repeat every x milliseconds */
	intervalCustom: number | undefined
	/** Stop repeating after this timestamp */
	repeatUntil: DateTimeObject | undefined
}
export function repeatTime(
	startTime: DateTimeObject,
	settings: RepeatingSettingsAny,
	options: {
		/** Timestamp */
		now: number
		/** Timestamp */
		end: number
		/** Max return count */
		maxCount: number
	}
): { startTimes: number[]; validUntil: number | undefined } {
	const start = startTime.unixTimestamp

	if (settings.type === RepeatingType.NO_REPEAT) {
		return { startTimes: [start], validUntil: undefined }
	} else if (settings.type === RepeatingType.DAILY) {
		const filterStart = options.now
		const filterEnd = options.end

		let days = Math.max(0, Math.floor((filterStart - start) / 24 / 3600 / 1000))
		days = days - (days % (settings.interval ?? 1))

		let prevTime = _.clone(startTime)
		const startTimes: number[] = []
		let validUntil: number | undefined = undefined
		while (startTimes.length < options.maxCount) {
			if (days > 9999) break

			const time = dateTimeAdvance(startTime, { date: days })

			if (time) {
				if (time.unixTimestamp > filterStart) {
					if (time.unixTimestamp > filterEnd) break
					if (time.unixTimestamp > (settings.repeatUntil?.unixTimestamp || Number.POSITIVE_INFINITY)) break

					if (startTimes.length === 0 && prevTime.unixTimestamp !== time.unixTimestamp) {
						startTimes.push(prevTime.unixTimestamp)
					}
					startTimes.push(time.unixTimestamp)

					if (time.unixTimestamp > filterStart) validUntil = time.unixTimestamp
				}
				prevTime = time
			}
			if (!settings.interval) break
			days += settings.interval
		}
		if (validUntil && validUntil >= (settings.repeatUntil?.unixTimestamp || Number.POSITIVE_INFINITY)) {
			validUntil = undefined
		}
		return { startTimes, validUntil }
	} else if (settings.type === RepeatingType.WEEKLY) {
		const filterStart = options.now
		const filterEnd = options.end

		const start = dateTimeObject(filterStart)
		const startMonday = dateTimeAdvance(start, { date: -start.weekDay - 7 })
		if (!startMonday) return { startTimes: [], validUntil: undefined }

		let days = 0
		let prevTime = _.clone(startTime)
		const startTimes: number[] = []
		let validUntil: number | undefined = undefined
		while (startTimes.length < options.maxCount) {
			if (days > 9999) break

			const time = dateTimeAdvance(startMonday, { date: days })

			if (time && (settings.weekdays ?? [])[time.weekDay]) {
				if (time.unixTimestamp > filterStart) {
					if (time.unixTimestamp > filterEnd) break
					if (time.unixTimestamp > (settings.repeatUntil?.unixTimestamp || Number.POSITIVE_INFINITY)) break

					if (startTimes.length === 0 && prevTime.unixTimestamp !== time.unixTimestamp) {
						startTimes.push(prevTime.unixTimestamp)
					}
					startTimes.push(time.unixTimestamp)

					if (time.unixTimestamp > filterStart) validUntil = time.unixTimestamp
				}
				prevTime = time
			}
			days++
		}
		if (validUntil && validUntil >= (settings.repeatUntil?.unixTimestamp || Number.POSITIVE_INFINITY)) {
			validUntil = undefined
		}
		return { startTimes, validUntil }
	} else if (settings.type === RepeatingType.MONTHLY) {
		let prevTime = _.clone(startTime)

		let months = 0
		const startTimes: number[] = []
		let validUntil: number | undefined = undefined
		while (startTimes.length < options.maxCount) {
			if (months > 9999) break

			const time = dateTimeAdvance(startTime, { month: months })

			if (time) {
				if (time.unixTimestamp > options.now) {
					if (time.unixTimestamp > options.end) break
					if (time.unixTimestamp > (settings.repeatUntil?.unixTimestamp || Number.POSITIVE_INFINITY)) break

					if (startTimes.length === 0 && prevTime.unixTimestamp !== time.unixTimestamp) {
						startTimes.push(prevTime.unixTimestamp)
					}
					startTimes.push(time.unixTimestamp)
					if (time.unixTimestamp > options.now) validUntil = time.unixTimestamp
				}
				prevTime = time
			}
			if (!settings.interval) break
			months += settings.interval
		}

		if (validUntil && validUntil >= (settings.repeatUntil?.unixTimestamp || Number.POSITIVE_INFINITY)) {
			validUntil = undefined
		}
		return { startTimes, validUntil }
	} else if (settings.type === RepeatingType.CUSTOM) {
		const interval = settings.intervalCustom ?? 1
		const filterStart = options.now - interval // Include last repeating time
		const filterEnd = options.end

		let time = start + Math.max(0, Math.floor((filterStart - start) / interval) * interval)
		const startTimes: number[] = []
		let validUntil: number | undefined = undefined
		while (
			time <= filterEnd &&
			startTimes.length < options.maxCount &&
			time <= (settings.repeatUntil?.unixTimestamp || Number.POSITIVE_INFINITY)
		) {
			startTimes.push(time)
			if (time > options.now) validUntil = time

			if (interval < 1000) break
			time += interval
		}

		if (validUntil && validUntil >= (settings.repeatUntil?.unixTimestamp || Number.POSITIVE_INFINITY)) {
			validUntil = undefined
		}
		return { startTimes, validUntil }
	} else {
		assertNever(settings)
		return { startTimes: [], validUntil: undefined }
	}
}
// TODO: Write unit tests

function strTime(str: string) {
	return new Date(str).getTime()
}
function strDate(str: string) {
	return dateTimeObject(new Date(str))
}
// Unit tests:
// Notes:
// * new Date('2022-10-29 12:00:00') is daylight saving time
// * new Date('2022-10-30 12:00:00') is not daylight saving time
try {
	assert(dateTimeAdvance(strDate('2022-07-05 18:00:00'), { date: 1 }), strDate('2022-07-06 18:00:00'))
	assert(dateTimeAdvance(strDate('2022-07-31 18:00:00'), { date: 1 }), strDate('2022-08-01 18:00:00'))
	assert(dateTimeAdvance(strDate('2022-12-31 18:00:00'), { date: 1 }), strDate('2023-01-01 18:00:00'))
	assert(dateTimeAdvance(strDate('2022-10-29 18:00:00'), { date: 1 }), strDate('2022-10-30 18:00:00'))

	assert(dateTimeAdvance(strDate('2020-01-05 18:00:00'), { date: 365 }), strDate('2021-01-04 18:00:00')) // 2020 is a leap year

	assert(dateTimeAdvance(strDate('2022-07-05 18:00:00'), { month: 1 }), strDate('2022-08-05 18:00:00'))
	assert(dateTimeAdvance(strDate('2022-07-31 18:00:00'), { month: 1 }), strDate('2022-08-31 18:00:00'))
	assert(dateTimeAdvance(strDate('2022-08-31 18:00:00'), { month: 1 }), null) // because 2022-09-31 doesn't exist
	assert(dateTimeAdvance(strDate('2022-12-31 18:00:00'), { month: 1 }), strDate('2023-01-31 18:00:00'))
	assert(dateTimeAdvance(strDate('2022-10-29 18:00:00'), { month: 1 }), strDate('2022-11-29 18:00:00'))

	assert(dateTimeAdvance(strDate('2020-01-05 18:00:00'), { month: 12 }), strDate('2021-01-05 18:00:00')) // even though 2020 is a leap year, the date should be kept the same.
	assert(
		repeatTime(
			strDate('2022-07-20 18:00:00'),
			{
				type: RepeatingType.NO_REPEAT,
			},
			{
				now: strTime('2022-07-20 17:00:00'),
				end: strTime('2022-07-21 17:00:00'),
				maxCount: 999,
			}
		).startTimes,
		[strTime('2022-07-20 18:00:00')]
	)
	assert(
		repeatTime(
			strDate('2022-07-19 18:00:00'),
			{
				type: RepeatingType.CUSTOM,
				intervalCustom: 60 * 60 * 1000,
				repeatUntil: strDate('2022-07-21 6:00:00'),
			},
			{
				now: strTime('2022-07-20 18:00:00'),
				end: strTime('2022-07-21 17:00:00'),
				maxCount: 999,
			}
		).startTimes,
		[
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
		]
	)
	assert(
		repeatTime(
			strDate('2022-07-20 18:00:00'),
			{
				type: RepeatingType.CUSTOM,
				intervalCustom: 60 * 60 * 1000,
				repeatUntil: strDate('2022-07-21 6:00:00'),
			},
			{
				now: strTime('2022-07-20 17:00:00'),
				end: strTime('2022-07-20 20:00:00'),
				maxCount: 999,
			}
		).startTimes,
		[strTime('2022-07-20 18:00:00'), strTime('2022-07-20 19:00:00'), strTime('2022-07-20 20:00:00')]
	)
	assert(
		repeatTime(
			strDate('2022-07-15 18:00:00'),
			{
				type: RepeatingType.DAILY,
				interval: 1,
				repeatUntil: strDate('2022-07-25 18:00:00'),
			},
			{
				now: strTime('2022-07-20 19:00:00'),
				end: strTime('2022-07-31 18:00:00'),
				maxCount: 999,
			}
		).startTimes,
		[
			strTime('2022-07-20 18:00:00'),
			strTime('2022-07-21 18:00:00'),
			strTime('2022-07-22 18:00:00'),
			strTime('2022-07-23 18:00:00'),
			strTime('2022-07-24 18:00:00'),
			strTime('2022-07-25 18:00:00'),
		]
	)
	assert(
		repeatTime(
			strDate('2022-10-29 18:00:00'),
			{
				type: RepeatingType.DAILY,
				interval: 2,
				repeatUntil: strDate('2022-11-05 18:00:00'),
			},
			{
				now: strTime('2022-10-29 18:00:00'),
				end: strTime('2022-12-31 23:59:59'),
				maxCount: 999,
			}
		).startTimes,
		[
			strTime('2022-10-29 18:00:00'),
			strTime('2022-10-31 18:00:00'),
			strTime('2022-11-02 18:00:00'),
			strTime('2022-11-04 18:00:00'),
		]
	)
	assert(
		repeatTime(
			strDate('2022-10-29 18:00:00'),
			{
				type: RepeatingType.DAILY,
				interval: 2,
				repeatUntil: undefined,
			},
			{
				now: strTime('2022-11-05 18:00:00'),
				end: strTime('2022-11-11 23:59:59'),
				maxCount: 999,
			}
		).startTimes,
		[
			strTime('2022-11-04 18:00:00'),
			strTime('2022-11-06 18:00:00'),
			strTime('2022-11-08 18:00:00'),
			strTime('2022-11-10 18:00:00'),
		]
	)
	assert(
		repeatTime(
			strDate('2022-07-31 18:00:00'),
			{
				type: RepeatingType.MONTHLY,
				interval: 1,
				repeatUntil: strDate('2023-02-15 18:00:00'),
			},
			{
				now: strTime('2022-07-20 19:00:00'),
				end: strTime('2023-07-31 18:00:00'),
				maxCount: 999,
			}
		).startTimes,
		[
			strTime('2022-07-31 18:00:00'),
			strTime('2022-08-31 18:00:00'),
			// strTime('2022-09-31 18:00:00'), // Doesn't exist
			strTime('2022-10-31 18:00:00'),
			// strTime('2022-11-31 18:00:00'), // Doesn't exist
			strTime('2022-12-31 18:00:00'),
			strTime('2023-01-31 18:00:00'),
		]
	)
	assert(
		repeatTime(
			strDate('2022-10-15 18:00:00'),
			{
				type: RepeatingType.MONTHLY,
				interval: 2,
				repeatUntil: strDate('2023-12-12 23:59:59'),
			},
			{
				now: strTime('2022-10-15 18:00:00'),
				end: strTime('2023-05-31 18:00:00'),
				maxCount: 999,
			}
		).startTimes,
		[
			strTime('2022-10-15 18:00:00'),
			strTime('2022-12-15 18:00:00'),
			strTime('2023-02-15 18:00:00'),
			strTime('2023-04-15 18:00:00'),
		]
	)
	assert(
		repeatTime(
			strDate('2022-10-15 18:00:00'),
			{
				type: RepeatingType.MONTHLY,
				interval: 2,
				repeatUntil: undefined,
			},
			{
				now: strTime('2023-03-15 18:00:00'),
				end: strTime('2023-05-31 18:00:00'),
				maxCount: 999,
			}
		).startTimes,
		[strTime('2023-02-15 18:00:00'), strTime('2023-04-15 18:00:00')]
	)
	assert(
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
				now: strTime('2022-10-12 18:00:00'),
				end: strTime('2022-10-21 18:00:00'),
				maxCount: 999,
			}
		).startTimes,
		[
			strTime('2022-10-12 18:00:00'), // wed
			strTime('2022-10-14 18:00:00'), // fri
			strTime('2022-10-16 18:00:00'), // sun
			strTime('2022-10-19 18:00:00'), // wed
			strTime('2022-10-21 18:00:00'), // fri
		]
	)
	assert(
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
				now: strTime('2022-10-21 18:00:00'),
				end: strTime('2022-10-27 18:00:00'),
				maxCount: 999,
			}
		).startTimes,
		[
			strTime('2022-10-21 18:00:00'), // fri
			strTime('2022-10-23 18:00:00'), // sun
			strTime('2022-10-26 18:00:00'), // wed
		]
	)
	assert(
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
				now: strTime('2022-10-30 18:00:00'),
				end: strTime('2022-12-31 18:00:00'),
				maxCount: 999,
			}
		).startTimes,
		[
			strTime('2022-10-24 18:00:00'), // mon
			strTime('2022-10-31 18:00:00'), // mon
			strTime('2022-11-07 18:00:00'), // mon
			strTime('2022-11-14 18:00:00'), // mon
			strTime('2022-11-21 18:00:00'), // mon
			strTime('2022-11-28 18:00:00'), // mon
		]
	)
} catch (e) {
	// eslint-disable-next-line no-console
	console.error(e)
}

export function parseDateTime(str: string): DateTimeObject | undefined {
	if (str === '') return undefined
	if (!str) return undefined

	let date: Date | undefined = undefined
	const m = str.match(/^(-?\d+)-(-?\d+)-(-?\d+) (-?\d+):(-?\d+):(-?\d+)$/)
	if (m) {
		date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6]))
		if (Number.isNaN(date.getTime())) date = undefined
	}
	if (!date) date = new Date(str)

	const d = dateTimeObject(date)

	if (dateTimeObjectIsValid(d)) {
		return d
	}

	return undefined
}
export function formatDateTime(d: DateTimeObject | Date | number | undefined | null): string {
	if (d === undefined) return ''
	if (d === null) return ''

	if (typeof d === 'number') {
		d = new Date(d)
	}
	if (d instanceof Date) {
		d = dateTimeObject(d)
	}

	// TODO: Maybe support locale datestring later?
	// return dateTimeObjectToDate(input).toLocaleString()

	let str = `${d.year}-${pad(d.month + 1)}-${pad(d.date)} ${pad(d.hour)}:${pad(d.minute)}:${pad(d.second)}`
	if (d.millisecond) {
		str += `.${pad(d.millisecond, 3)}`
	}
	return str
}

try {
	assert(parseDateTime('2022-11-28 18:00:00'), dateTimeObject(new Date('2022-11-28 18:00:00')))
	assert(parseDateTime('2022-01-01 18:00:00'), dateTimeObject(new Date('2022-01-01 18:00:00')))
	assert(parseDateTime('2022-11-28 18:00:00'), parseDateTime('2022-11-28 18:00:00'))
	assert(parseDateTime('2022-11-28 18:00:-1'), parseDateTime('2022-11-28 17:59:59'))
	assert(parseDateTime('2022-11-28 18:-1:00'), parseDateTime('2022-11-28 17:59:00'))
	assert(parseDateTime('2022-11-28 -1:00:00'), parseDateTime('2022-11-27 23:00:00'))
	assert(parseDateTime('2022-11-00 18:00:00'), parseDateTime('2022-10-31 18:00:00'))
	assert(parseDateTime('2022-11--1 18:00:00'), parseDateTime('2022-10-30 18:00:00'))
	assert(parseDateTime('2022-00-28 18:00:00'), parseDateTime('2021-12-28 18:00:00'))
	assert(parseDateTime('2022--1-28 18:00:00'), parseDateTime('2021-11-28 18:00:00'))
} catch (e) {
	// eslint-disable-next-line no-console
	console.error(e)
}
