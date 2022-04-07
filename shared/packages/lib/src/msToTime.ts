import parseMilliseconds from 'parse-ms'
import prettyMilliseconds from 'pretty-ms'

export const parseMs = (duration: number) => {
	return parseMilliseconds(duration)
}

export const msToTime = (duration: number) => {
	return prettyMilliseconds(duration, { colonNotation: true })
}
