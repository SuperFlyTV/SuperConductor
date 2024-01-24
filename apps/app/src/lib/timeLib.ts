import { assertNever } from '@shared/lib'
import _ from 'lodash'

export function parseDuration(str: string, isWriting?: boolean): number | null | undefined {
	if (str === '') return null
	if (str === '∞') return null
	if (!str) return undefined

	str = str.trim()
	str = str.replace(/,/g, '.')

	str = str.replace(/^∞/g, '') // Remove initial ∞
	str = str.replace(/∞$/g, '') // Remove tailing ∞

	if (isWriting) {
		// A few cases where the user is still writing, so we don't really want to parse it

		{
			const m = str.match(/^(\d{1,2}):(\d{2}):(\d{2})\.(\d*0)$/) // hh:mm:ss.xx0
			if (m) return undefined
		}
		{
			const m = str.match(/^(\d{1,2}):(\d{2})\.(\d*0)$/) // mm:ss.xx0
			if (m) return undefined
		}
		{
			const m = str.match(/^(\d{1,2})\.(\d*?0)$/) // ss.xx0
			if (m) return undefined
		}
		{
			const m = str.match(/[:;,.-]$/) // anything tailing :;,.-
			if (m) return undefined
		}
	}

	{
		const m = str.match(/^(\d{1,2}):(\d{2}):(\d{2})\.(\d{1,3})$/) // hh:mm:ss.xxx
		if (m) return sumTime(m[1], m[2], m[3], m[4], isWriting)
	}

	{
		const m = str.match(/^(\d{1,2}):(\d{2})\.(\d{1,3})$/) // mm:ss.xxx
		if (m) return sumTime(0, m[1], m[2], m[3], isWriting)
	}

	{
		const m = str.match(/^(\d{1,2})\.(\d{1,3})$/) // ss.xxx
		if (m) return sumTime(0, 0, m[1], m[2], isWriting)
	}
	{
		const m = str.match(/^\.(\d{1,3})$/) // .xxx
		if (m) return sumTime(0, 0, 0, m[1], isWriting)
	}

	{
		const m = str.match(/^(\d{1,2}):(\d{2}):(\d{2})$/) // hh:mm:ss | hhmmss
		if (m) return sumTime(m[1], m[2], m[3], 0, isWriting)
	}
	{
		const m = str.match(/^(\d{1,2}):(\d{2})(\d{2})$/) // hh:mmss
		if (m) sumTime(m[1], m[2], m[3], 0, isWriting)
	}

	{
		const m = str.match(/^(\d{1,2})(\d{2})(\d{2})$/) // hhmmss
		if (m) return sumTime(m[1], m[2], m[3], 0, isWriting)
	}

	{
		const m = str.match(/^(\d{1,2}):(\d{2})$/) // mm:ss
		if (m) return sumTime(0, m[1], m[2], 0, isWriting)
	}

	{
		const m = str.match(/^(\d{1,2})(\d{2})$/) // mmss
		if (m) return sumTime(0, m[1], m[2], 0, isWriting)
	}
	{
		const m = str.match(/^(\d{1,2})(\d{2})\.(\d{1,3})$/) // mmss.xxx
		if (m) return sumTime(0, m[1], m[2], m[3], isWriting)
	}

	{
		const m = str.match(/^(\d{1,2})$/) // ss
		if (m) return sumTime(0, 0, m[1], 0, isWriting)
	}

	// Transition-formats (ie these might show up while typing):
	{
		const m = str.match(/^(\d{1,2}):(\d{3,4})$/) // hh:mmxx
		if (m) return parseDuration(m[1] + m[2], isWriting) // -> hhmmss
	}
	{
		const m = str.match(/^(\d{1}):(\d{1,2}):(\d{3})$/) // h:mm:ssx
		if (m) return parseDuration(m[1] + m[2] + m[3], isWriting) // -> hhmmss
	}
	{
		const m = str.match(/^(\d{1,2}):(\d{1})$/) // s:s or ms:s
		if (m) return parseDuration(m[1] + m[2], isWriting) // -> ss or m:ss
	}
	{
		const m = str.match(/^(\d{1,2}):(\d{2}):(\d{1})$/) // m:ms:s or hm:ms:s
		if (m) return parseDuration(m[1] + m[2] + m[3], isWriting) // -> mm:ss or h:mm:ss xxxxxxxxxxxxxxxxxxxxxxxxx
	}
	{
		const m = str.match(/^(\d{1,2}):$/) // s: or ss:
		if (m) return parseDuration(m[1], isWriting) // -> s or ss
	}
	{
		const m = str.match(/^(\d{1,2}):(\d{2}):$/) // m:ss: or mm:ss:
		if (m) return parseDuration(m[1] + m[2], isWriting) // -> m:ss or mm:ss
	}
	{
		const m = str.match(/^:(\d{2})$/) // :ss
		if (m) return parseDuration(m[1], isWriting) // -> ss
	}
	{
		const m = str.match(/^:(\d{2}):(\d{2})$/) // :mm:ss
		if (m) return parseDuration(m[1] + m[2], isWriting) // -> mm:ss
	}
	{
		const m = str.match(/^(\d{3,4}):(\d{2})$/) // hmm:ss or hhmm:ss
		if (m) return parseDuration(m[1] + m[2], isWriting) // -> h:mm:ss or hh:mm:ss
	}

	return undefined
}

function sumTime(
	hhStr: string | number,
	mmStr: string | number,
	ssStr: string | number,
	xxxStr: string | number,
	isWriting: boolean | undefined
): number | undefined {
	const hh = typeof hhStr === 'number' ? hhStr : parseInt(hhStr)
	const mm = typeof mmStr === 'number' ? mmStr : parseInt(mmStr)
	const ss = typeof ssStr === 'number' ? ssStr : parseInt(ssStr)
	const xxx = typeof xxxStr === 'number' ? xxxStr : parseMilliseconds(xxxStr)

	if (isWriting && mm >= 60) return undefined
	if (isWriting && ss >= 60) return undefined
	return hh * 3600000 + mm * 60000 + ss * 1000 + xxx
}

function parseMilliseconds(ms: string): number {
	if (!ms) return 0

	return Math.floor(parseFloat(`0.${ms}`) * 1000)
}
export function millisecondsToTime(ms: number): { h: number; m: number; s: number; ms: number } {
	ms = Math.abs(ms)
	const h = Math.floor(ms / 3600000)
	ms -= h * 3600000

	const m = Math.floor(ms / 60000)
	ms -= m * 60000

	const s = Math.floor(ms / 1000)
	ms -= s * 1000

	return { h, m, s, ms }
}

export function formatDuration(
	inputMs: number | null | undefined,
	decimalCount?: number | 'smart',
	/** Set to true if the duration is used in a countdown (this causes it to turns to "0" at 0 ) */
	isCountDown?: boolean
): string {
	if (inputMs === null) return '∞'
	if (inputMs === undefined) return ''

	let omitZeroMs = false
	if (decimalCount === 'smart') {
		if (inputMs > 60000) {
			decimalCount = 0
		} else {
			omitZeroMs = true
			decimalCount = 1
		}
	}

	if (isCountDown && decimalCount !== undefined && inputMs > 0) {
		// Special case: when displaying countdowns, "00:00" should display at time 0, not 0.999
		if (decimalCount === 0) inputMs += 999
		if (decimalCount === 1) inputMs += 99
		if (decimalCount === 2) inputMs += 9
	}

	let sign = Math.sign(inputMs) < 0 ? '-' : ''
	const { h, m: min, s: sec, ms } = millisecondsToTime(inputMs)

	let msStr = !ms ? '000' : ms < 10 ? `00${ms}` : ms < 100 ? `0${ms}` : `${ms}` // 001 | 012 | 123

	if (decimalCount !== undefined) {
		msStr = msStr.slice(0, decimalCount)
	} else {
		msStr = msStr.replace(/0+$/, '') // trim trailing zeros
	}
	if (omitZeroMs && msStr.match(/^0*$/)) msStr = '' // msStr is only zeroes, so omit them
	if (msStr) msStr = '.' + msStr

	if (h) return `${sign}${h}:${pad(min)}:${pad(sec)}${msStr}`
	if (min) return `${sign}${min}:${pad(sec)}${msStr}`

	if (sec === 0 && !msStr) sign = '' // Don't show "-0"

	return `${sign}${sec}${msStr}`
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
/**
 * Recalculate the DateTimeObject.
 * Essentially this updates the unixTimestamp, and the weekDay to match the year/month/date and hour/minute/second/millisecond.
 */
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
export function dateTimeAdvance(d: DateTimeObject, a: { date: number } | { month: number }): DateTimeObject | null {
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
	/** Repeat every X day, defaults to 1 */
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
	/** Repeat every X month, defaults to 1 */
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
		const interval = settings.interval ?? 1

		let days = Math.max(0, Math.floor((filterStart - start) / 24 / 3600 / 1000))
		days = days - (days % interval)

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
			if (!interval) break
			days += interval
		}
		if (validUntil && validUntil >= (settings.repeatUntil?.unixTimestamp || Number.POSITIVE_INFINITY)) {
			validUntil = undefined
		}
		return { startTimes, validUntil }
	} else if (settings.type === RepeatingType.WEEKLY) {
		const filterStart = options.now
		const filterEnd = options.end

		const filterStartObj = dateTimeObject(filterStart)
		const startMonday = dateTimeAdvance(filterStartObj, { date: -filterStartObj.weekDay - 7 })
		if (!startMonday) return { startTimes: [], validUntil: undefined }

		startMonday.hour = startTime.hour
		startMonday.minute = startTime.minute
		startMonday.second = startTime.second
		startMonday.millisecond = startTime.millisecond
		updateDateTimeObject(startMonday)

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

					if (
						startTimes.length === 0 &&
						prevTime.unixTimestamp !== time.unixTimestamp &&
						prevTime.unixTimestamp >= start
					) {
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
		const interval = settings.interval ?? 1

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
			if (!interval) break
			months += interval
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

export function parseDateTime(str: string): DateTimeObject | undefined {
	if (str === '') return undefined
	if (!str) return undefined

	let date: Date | undefined = undefined
	{
		const m = str.match(/^(-?\d+)-(-?\d+)-(-?\d+) (-?\d+):(-?\d+):(-?\d+)$/) // yyyy-mm-dd hh:mm:ss
		if (m) {
			const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6]))
			if (dateIsReasonable(d)) date = d
		}
	}

	let dayDate = new Date()
	let dayDateHasBeenSet = false

	{
		const m = str.match(/^(-?\d+)-(-?\d+)-(-?\d+)(.*)$/) // yyyy-mm-dd
		if (m) {
			const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0)
			if (dateIsReasonable(d)) {
				dayDate = d
				dayDateHasBeenSet = true
				str = m[4] // Set the string to the "rest"
			}
		}
	}

	if (!date) {
		// Handle input that looks like duration, like hh:mm:ss, hhmm etc...
		// Interpret it as "the time today"
		const duration = parseDuration(str)
		if (typeof duration === 'number') {
			let durationString = formatDuration(duration)
			if (!durationString.match(/:/)) durationString += ':00'

			// Note: We're exploiting a lucky coincidence here;
			// formatDuration('123') evaluates to 1 minute 23 seconds ('1:23')
			// But when combined with a date ('2020-01-01 8:00') it is interpreted as 1 hour 23 minutes,
			// which is actually what we want.

			const fullDateString = `${dayDate.getFullYear()}-${
				dayDate.getMonth() + 1
			}-${dayDate.getDate()} ${durationString}`

			const d = new Date(fullDateString)

			if (dateIsReasonable(d)) date = d
		}
	}
	if (!date) {
		const d = new Date(str)
		if (dateIsReasonable(d)) date = d
	}

	if (!date) {
		if (dayDateHasBeenSet) {
			date = dayDate
		}
	}

	// Last resort: use "now"
	if (!date) {
		date = new Date()
	}

	const dateTimeObj = dateTimeObject(date)
	if (dateTimeObjectIsValid(dateTimeObj)) {
		return dateTimeObj
	} else {
		return undefined
	}
}
function dateIsReasonable(d: Date): boolean {
	const now = new Date()
	if (Number.isNaN(d.getTime())) return false

	// Assuming we're only interested in dates +- 20 years from now:
	if (d.getFullYear() < now.getFullYear() - 20) return false
	if (d.getFullYear() > now.getFullYear() + 20) return false

	return true
}
export function formatDateTime(
	d: DateTimeObject | Date | number | undefined | null,
	allowShort = false,
	decimalMaxCount?: number
): string {
	if (d === undefined) return ''
	if (d === null) return ''

	if (typeof d === 'number') {
		d = new Date(d)
	}
	if (d instanceof Date) {
		d = dateTimeObject(d)
	}

	let millisecondStr = d.millisecond ? `.${pad(d.millisecond, 3)}` : ''
	if (decimalMaxCount === 0) {
		millisecondStr = ''
	} else if (decimalMaxCount) {
		millisecondStr = millisecondStr.slice(0, 1 + decimalMaxCount)
	}
	const timeStr = `${pad(d.hour)}:${pad(d.minute)}:${pad(d.second)}${millisecondStr}`
	const dateStr = `${d.year}-${pad(d.month + 1)}-${pad(d.date)}`

	if (allowShort) {
		const today = dateTimeObject(new Date())

		if (today.year === d.year && today.month === d.month && today.date === d.date) {
			// Display short time:
			return timeStr
		}
	}

	// TODO: Maybe support locale datestring later?
	// return dateTimeObjectToDate(input).toLocaleString()

	return `${dateStr} ${timeStr}`
}
