import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

export interface DeltaPosition {
	x: number
	y: number
}
export interface Position {
	clientX: number
	clientY: number
}

/**
 * The minimum distance, in pixels, that a drag must be performed before isDragging is set to true.
 */
const MIN_DRAG_DISTANCE = 1

export function useMovable(
	moveElement: React.RefObject<HTMLDivElement | null>,

	callbacks: {
		/** Called upon drag start move */
		onDragStart: (position: Position) => void
		/** Called upon drag move */
		onDragMove: (delta: DeltaPosition, position: Position) => void
		/** Called upon drag end */
		onDragEnd: (delta: DeltaPosition, position: Position) => void
	}
) {
	const originPointerPosition = useRef<{ clientX: number; clientY: number } | undefined>(undefined)
	const isDragging = useRef<boolean>(false)
	const delta = useRef<DeltaPosition>({ x: 0, y: 0 })
	const position = useRef<Position>({ clientX: 0, clientY: 0 })
	const onPointerMoveIsSet = useRef<boolean>(false)
	const moveId = useRef<number>(0)

	useLayoutEffect(() => {
		const el = moveElement.current
		if (!el) return

		el.addEventListener('pointerdown', onPointerDown)
		document.body.addEventListener('pointerup', onPointerUp)
		return () => {
			el.removeEventListener('pointerdown', onPointerDown)
			document.body.removeEventListener('pointerup', onPointerUp)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const onPointerDown = useCallback((event: PointerEvent) => {
		originPointerPosition.current = {
			clientX: event.clientX,
			clientY: event.clientY,
		}
		// Do nothing else here, the consumer will call onStartMoving if we are to start moving
	}, [])

	// Called by consumer when a movement starts
	const onStartMoving = useCallback((takeOver?: { clientX: number; clientY: number }) => {
		moveId.current++

		if (takeOver) {
			if (!originPointerPosition.current) {
				originPointerPosition.current = takeOver
			} else {
				// eslint-disable-next-line no-console
				console.error(
					'Warning: onStartMoving: takeOver is set, but originPointerPosition.current is already set'
				)
			}
		}

		if (!originPointerPosition.current) {
			// eslint-disable-next-line no-console
			console.error('Warning: onStartMoving: originPointerPosition.current was not set')
		}

		if (!onPointerMoveIsSet.current) {
			onPointerMoveIsSet.current = true
			document.body.addEventListener('pointermove', onPointerMove)
		} else {
			// eslint-disable-next-line no-console
			console.error('Warning: onStartMoving: onPointerMoveIsSet.current was already set')
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const updateMove = useCallback(() => {
		if (isDragging.current) {
			callbacks.onDragMove(delta.current, position.current)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const onPointerMove = useCallback((event: PointerEvent) => {
		position.current = {
			clientX: event.clientX,
			clientY: event.clientY,
		}
		if (!originPointerPosition.current) {
			// Dirty fix:
			originPointerPosition.current = position.current
		}

		delta.current = {
			x: position.current.clientX - originPointerPosition.current.clientX,
			y: position.current.clientY - originPointerPosition.current.clientY,
		}

		if (Math.abs(delta.current.x) >= MIN_DRAG_DISTANCE || Math.abs(delta.current.y) >= MIN_DRAG_DISTANCE) {
			if (!isDragging.current) {
				isDragging.current = true
				callbacks.onDragStart(position.current)
			}
		}

		updateMove()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const onPointerUp = useCallback((_event: PointerEvent) => {
		if (isDragging.current) {
			try {
				callbacks.onDragEnd(delta.current, position.current)
			} catch (err) {
				// eslint-disable-next-line no-console
				console.error(err)
			}
		}
		cleanupMove()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])
	const cleanupMove = useCallback(() => {
		// Cleanup:
		isDragging.current = false

		if (onPointerMoveIsSet.current) {
			document.body.removeEventListener('pointermove', onPointerMove)
			onPointerMoveIsSet.current = false
		}
		originPointerPosition.current = undefined
		delta.current = { x: 0, y: 0 }
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	useEffect(() => {
		return () => {
			cleanupMove()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return {
		onStartMoving,
		updateMove,
	}
}
