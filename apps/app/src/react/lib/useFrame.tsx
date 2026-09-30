import { useState, useEffect, useRef } from 'react'

/**
 * Execute callback on every frame
 * Callback function returns true to evaluate again on next frame. If it return false, the computation will pause until next deps change.
 */
export function useFrame(fcn: (nowTime: number) => boolean, deps: React.DependencyList): void {
	const [time, setTime] = useState(0)

	const isRunning = useRef(true)

	useEffect(() => {
		// Each run of this effect owns its own frame loop.
		// It is important that the loop is cancelled in the cleanup, otherwise a new loop
		// would be added (and never stopped) every time the deps change.
		let cancelled = false
		let frameId: number | null = null

		isRunning.current = true

		const updateFrame = () => {
			frameId = null
			if (cancelled || !isRunning.current) return

			setTime(Date.now())

			frameId = window.requestAnimationFrame(updateFrame)
		}
		updateFrame()

		return () => {
			cancelled = true
			isRunning.current = false
			if (frameId !== null) window.cancelAnimationFrame(frameId)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps)

	useEffect(() => {
		const continueEvaluations = fcn(time)
		if (!continueEvaluations) isRunning.current = false
	}, [fcn, time])
}
