import React from 'react'
import { millisecondsToTime } from '../../../../../../lib/timeLib'

export function timelineObjectDurationString(duration: number | null): string {
	if (duration === null) return '∞'
	const { h, m, s, ms } = millisecondsToTime(duration)
	const secondTenths = Math.floor(ms / 100)

	let durationTitle = ''
	// if (days) {
	// 	durationTitle += days + 'd'
	// }
	if (h) {
		durationTitle += h + 'h'
	}
	if (m) {
		durationTitle += m + 'm'
	}
	if (s) {
		if (secondTenths) {
			durationTitle += s + '.' + secondTenths + 's'
		} else {
			durationTitle += s + 's'
		}
	}

	return durationTitle
}
export function TimelineObjectDuration(props: { duration: number | null }) {
	if (props.duration === null) return <div className="duration">∞</div>
	if (props.duration === 0) return <div className="duration">0</div>
	const { h, m, s, ms } = millisecondsToTime(props.duration)
	const secondTenths = Math.floor(ms / 100)
	return (
		<div className="duration">
			{/* {days ? (
				<>
					<span>{days}</span>
					<span style={{ fontWeight: 300 }}>d</span>
				</>
			) : null} */}
			{h ? (
				<>
					<span>{h}</span>
					<span style={{ fontWeight: 300 }}>h</span>
				</>
			) : null}
			{m ? (
				<>
					<span>{m}</span>
					<span style={{ fontWeight: 300 }}>m</span>
				</>
			) : null}
			{s ? (
				secondTenths ? (
					<>
						<span>{s}</span>
						<span style={{ fontWeight: 300 }}>.</span>
						<span>{secondTenths}</span>
						<span style={{ fontWeight: 300 }}>s</span>
					</>
				) : (
					<>
						<span>{s}</span>
						<span style={{ fontWeight: 300 }}>s</span>
					</>
				)
			) : null}
		</div>
	)
}
