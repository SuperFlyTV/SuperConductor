import { useCallback, useEffect, useState } from 'react'

type HTMLElementEventHandler<T> = (this: HTMLElement, ev: T) => any

type StartingValues = {
	dragging: boolean
	pointerX: number
	pointerY: number
	originX: number
	originY: number
}

/**
 * The minimum distance, in pixels, that a drag must be performed before isDragging is set to true.
 */
const MIN_DRAG_DISTANCE = 1

export function useMovable(
	el: HTMLElement | null,
	startingValues: StartingValues = {
		dragging: false,
		pointerX: 0,
		pointerY: 0,
		originX: 0,
		originY: 0,
	}
): [boolean, number, number, number, number, number, number] {
	const [isDragging, setIsDragging] = useState(startingValues.dragging)
	const [isPointerDown, setIsPointerDown] = useState(startingValues.dragging)
	const [pointerPosition, setPointerPosition] = useState({
		clientX: startingValues.pointerX,
		clientY: startingValues.pointerY,
	})
	const [originPointerPosition, setOriginPointerPosition] = useState({
		clientX: startingValues.originX,
		clientY: startingValues.originY,
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
	const onPointerDown = useCallback<HTMLElementEventHandler<PointerEvent>>((ev) => {
		if (ev.pointerType === 'mouse' && ev.buttons !== 0b0001) {
			return
		}

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
	}, [])

	useEffect(() => {
		const horizontalMoveMeetsThreshold =
			Math.abs(pointerPosition.clientX - originPointerPosition.clientX) >= MIN_DRAG_DISTANCE
		const verticalMoveMeetsThreshold =
			Math.abs(pointerPosition.clientY - originPointerPosition.clientY) >= MIN_DRAG_DISTANCE
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
	}, [el, onPointerDown])

	useEffect(() => {
		document.body.addEventListener('pointerup', onPointerUp)
		document.body.addEventListener('pointermove', onPointerMove)

		return () => {
			document.body.removeEventListener('pointerup', onPointerUp)
			document.body.removeEventListener('pointermove', onPointerMove)
		}
	}, [onPointerMove, onPointerUp])

	return [
		isDragging,
		pointerPosition.clientX - originPointerPosition.clientX,
		pointerPosition.clientY - originPointerPosition.clientY,
		pointerPosition.clientX,
		pointerPosition.clientY,
		originPointerPosition.clientX,
		originPointerPosition.clientY,
	]
}
