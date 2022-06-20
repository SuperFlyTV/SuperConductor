import React, { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

import './style.scss'

/**
 * The scrollwatcher is used to wrap long lists of objects, so that not all need to be rendered at once.
 * It is a very lightweight component, leaving the limiting of the list to the user.
 * @returns
 */
export const ScrollWatcher: React.FC<{
	children: React.ReactNode
	/** Callback, is called when the container has scrolled to the bottom. User should load/add more elements at this time.  */
	onNearBottom: () => void
	/** Size of the original list */
	totalCount: number
	/** Size of the limited list */
	currentCount: number
	/** Estimation of height of a child element, used to pad the bottom a bit */
	childHeight?: number
}> = function Row({ children, onNearBottom, totalCount, currentCount, childHeight }) {
	const containerRef = useRef<HTMLDivElement | null>(null)
	const bottomRef = useRef<HTMLDivElement | null>(null)

	const coolDown = useRef<boolean>(false)

	const bottomPadding = useRef<number>(0)

	const checkIfAtBottom = useCallback(() => {
		if (containerRef.current) {
			const scrollPosition = containerRef.current.scrollTop
			const containerSize =
				containerRef.current.scrollHeight - containerRef.current.offsetHeight - bottomPadding.current

			const isNearBottom = scrollPosition >= containerSize - 100

			if (isNearBottom) {
				if (!coolDown.current) {
					coolDown.current = true

					onNearBottom()
				}
			}
		}
	}, [])

	useLayoutEffect(() => {
		coolDown.current = false

		if (containerRef.current && bottomRef.current) {
			const containerSize =
				containerRef.current.scrollHeight - containerRef.current.offsetHeight - bottomPadding.current

			const countHidden = totalCount - currentCount
			const averageSize = childHeight || (currentCount && containerSize / currentCount)

			// Add some padding to the bottom, so that the scrollbar reflects the correct size (ish)

			bottomPadding.current = averageSize * countHidden
			bottomRef.current.style.height = `${bottomPadding.current}px`
		}

		checkIfAtBottom()
	}, [totalCount, currentCount])

	useEffect(() => {
		if (containerRef.current) {
			containerRef.current.addEventListener('scroll', checkIfAtBottom, { passive: true })
		}
		return () => {
			containerRef.current?.removeEventListener('scroll', checkIfAtBottom)
		}
	})

	return (
		<>
			<div className="scrooll-watch-container" ref={containerRef}>
				{children}

				<div ref={bottomRef}></div>
			</div>
		</>
	)
}
