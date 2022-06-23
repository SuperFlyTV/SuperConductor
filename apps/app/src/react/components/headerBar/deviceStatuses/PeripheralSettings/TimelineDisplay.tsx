import { KeyDisplay, KeyDisplayTimeline } from '@shared/api'
import { TimelineTracker } from '@shared/lib'
import { useContext, useEffect, useRef, useState } from 'react'
import { LoggerContext } from '../../../../contexts/Logger'

export const TimelineDisplay: React.FC<{
	keyDisplayTimeline: KeyDisplay | KeyDisplayTimeline
	render: (keyDisplay: KeyDisplay) => JSX.Element
}> = ({ keyDisplayTimeline, render }) => {
	const [keyDisplay, setKeyDisplay] = useState<KeyDisplay | null>(null)
	const tracker = useRef<TimelineTracker | undefined>(undefined)
	const log = useContext(LoggerContext)

	useEffect(() => {
		if (Array.isArray(keyDisplayTimeline)) {
			// It is a timeline, which means that we should resolve it and track it.
			tracker.current = new TimelineTracker(log, keyDisplayTimeline, (keyDisplay: KeyDisplay) => {
				setKeyDisplay(keyDisplay)
			})
		} else {
			setKeyDisplay(keyDisplayTimeline)
		}

		return () => {
			if (tracker.current) {
				tracker.current.stop()
				tracker.current = undefined
			}
		}
	}, [keyDisplayTimeline, log])

	return keyDisplay ? render(keyDisplay) : null
}
