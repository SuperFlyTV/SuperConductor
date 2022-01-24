export function parseDuration(str: string): number | undefined {
	if (!str) return undefined

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

	return undefined
}

function assert<T>(val: T, check: T) {
	if (val !== check) throw new Error(`Assertion failed, expected ${check} but got ${val}`)
}
function parseMilliseconds(ms: string): number {
	if (!ms) return 0

	return Math.floor(parseFloat(`0.${ms}`) * 1000)
}

export function formatDuration(ms: number | undefined): string {
	if (ms === undefined) return ''

	const h = Math.floor(ms / 3600000)
	ms -= h * 3600000
	const min = Math.floor(ms / 60000)
	ms -= min * 60000

	const sec = Math.floor(ms / 1000)
	ms -= sec * 1000

	let msStr = !ms ? '' : ms < 10 ? `.00${ms}` : ms < 100 ? `.0${ms}` : `.${ms}`

	msStr = msStr.replace(/0+$/, '') // trim trailing zeros

	if (h) return `${h}:${pad(min)}:${pad(sec)}` + msStr
	if (min) return `${min}:${pad(sec)}` + msStr
	return `${sec}` + msStr
}
function pad(n: number): string {
	return n < 10 ? `0${n}` : `${n}`
}

// Unit tests:
assert(parseDuration('asdf'), undefined)
assert(parseDuration('00:00:00.000'), 0)
assert(parseDuration('1'), 1000)
assert(parseDuration('12'), 12000)
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

assert(formatDuration(1000), '1')
assert(formatDuration(1500), '1.5')
assert(formatDuration(1050), '1.05')
assert(formatDuration(1005), '1.005')
assert(formatDuration(61000), '1:01')
assert(formatDuration(3661000), '1:01:01')
assert(formatDuration(3661500), '1:01:01.5')

assert(formatDuration(parseDuration('5')), '5')
assert(formatDuration(parseDuration('10')), '10')
assert(formatDuration(parseDuration('1:05')), '1:05')
assert(formatDuration(parseDuration('1:01:05')), '1:01:05')
assert(formatDuration(parseDuration('1:01:01.5')), '1:01:01.5')
