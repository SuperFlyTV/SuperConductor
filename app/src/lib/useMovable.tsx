import { useCallback, useEffect, useRef, useState } from 'react'

type HTMLElementEventHandler<T, E extends HTMLElement = HTMLElement> = (this: HTMLElement, ev: T) => any

/**
 * The minimum distance, in pixels, that a drag must be performed before isDragging is set to true.
 */
const MIN_DRAG_DISTANCE = 1

export function useMovable(el: HTMLElement | null): [boolean, number, number] {
	const [isDragging, setIsDragging] = useState(false)
	const [isPointerDown, setIsPointerDown] = useState(false)
	const [pointerPosition, setPointerPosition] = useState({
		clientX: 0,
		clientY: 0,
	})
	const [originPointerPosition, setOriginPointerPosition] = useState({
		clientX: 0,
		clientY: 0,
	})
	const onPointerMove = useCallback<HTMLElementEventHandler<PointerEvent>>((ev) => {
		setPointerPosition({
			clientX: ev.clientX,
			clientY: ev.clientY,
		})
	}, [])
	const onPointerUp = useCallback<HTMLElementEventHandler<PointerEvent>>((ev) => {
		setIsPointerDown(false)
		ev.preventDefault()
	}, [])
	const onPointerDown = useCallback<HTMLElementEventHandler<PointerEvent>>(
		(ev) => {
			if (ev.pointerType === 'mouse' && ev.buttons !== 0b0001) {
				return
			}

			document.body.addEventListener('pointerup', onPointerUp)
			document.body.addEventListener('pointermove', onPointerMove)

			// These are order-sensitive.
			setOriginPointerPosition({
				clientX: ev.clientX,
				clientY: ev.clientY,
			})
			setPointerPosition({
				clientX: ev.clientX,
				clientY: ev.clientY,
			})
			setIsPointerDown(true)

			ev.preventDefault()
		},
		[onPointerUp]
	)

	useEffect(() => {
		const horizontalMoveMeetsThreshold =
			Math.abs(pointerPosition.clientX - originPointerPosition.clientX) > MIN_DRAG_DISTANCE
		const verticalMoveMeetsThreshold =
			Math.abs(pointerPosition.clientY - originPointerPosition.clientY) > MIN_DRAG_DISTANCE
		if (isPointerDown && (horizontalMoveMeetsThreshold || verticalMoveMeetsThreshold)) {
			setIsDragging(true)
		} else {
			setIsDragging(false)
		}
	}, [isPointerDown, pointerPosition, originPointerPosition])

	useEffect(() => {
		if (!el) return

		el.addEventListener('pointerdown', onPointerDown)

		return () => {
			if (!el) return

			el.removeEventListener('pointerdown', onPointerDown)
		}
	}, [el])

	return [
		isDragging,
		pointerPosition.clientX - originPointerPosition.clientX,
		pointerPosition.clientY - originPointerPosition.clientY,
	]
}
