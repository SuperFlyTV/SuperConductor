export function parseDuration(str: string, isWriting?: boolean): number | null | undefined {
	if (str === '') return null
	if (str === '∞') return null
	if (!str) return undefined

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

function assert<T>(val: T, check: T) {
	if (val !== check) throw new Error(`Assertion failed, expected ${check} but got ${val}`)
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

export function formatDuration(inputMs: number | null | undefined, decimalCount?: number): string {
	if (inputMs === null) return '∞'
	if (inputMs === undefined) return ''

	const { h, m: min, s: sec, ms } = millisecondsToTime(inputMs)

	let msStr = !ms ? '000' : ms < 10 ? `00${ms}` : ms < 100 ? `0${ms}` : `${ms}` // 001 | 012 | 123

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
function pad(n: number): string {
	return n < 10 ? `0${n}` : `${n}`
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
assert(parseDuration('∞1'), 1000)
assert(parseDuration('1:234'), 12 * 60000 + 34 * 1000) // 12:34
assert(parseDuration('12:345'), 1 * 3600000 + 23 * 60000 + 45 * 1000) // 1:23:45
assert(parseDuration('1:23:456'), 12 * 3600000 + 34 * 60000 + 56 * 1000) // 12:34:56
assert(parseDuration('1:16:3', true), undefined) // because while writing it would become 11:63 -> 12:03

// Special cases that happen when user adds numbers at the beginning while typing:
assert(parseDuration('1∞'), 1000)
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
