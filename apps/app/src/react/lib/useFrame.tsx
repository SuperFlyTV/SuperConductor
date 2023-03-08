import { useState, useEffect, useRef, useCallback } from 'react'

/** Execute callback on every frame */
export function useFrame(fcn: (nowTime: number) => void, deps: React.DependencyList): void {
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
		fcn(time)
	}, [fcn, time])
}
