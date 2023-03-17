import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Execute callback on every frame
 * Callback function returns true to evaluate again on next frame. If it return false, the computation will pause until next deps change.
 */
export function useFrame(fcn: (nowTime: number) => boolean, deps: React.DependencyList): void {
	const [time, setTime] = useState(0)

	const isRunning = useRef(true)

	const updateFrame = useCallback(() => {
		if (!isRunning.current) return

		setTime(Date.now())

		window.requestAnimationFrame(() => {
			updateFrame()
		})
	}, [])

	useEffect(() => {
		isRunning.current = true
		updateFrame()
		return () => {
			isRunning.current = false
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps)

	useEffect(() => {
		const continueEvaluations = fcn(time)
		if (!continueEvaluations) isRunning.current = false
	}, [fcn, time])
}
