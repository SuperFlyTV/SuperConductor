import { useCallback, useEffect, useRef, useState } from 'react'

type HTMLElementEventHandler<T, E extends HTMLElement = HTMLElement> = (this: HTMLElement, ev: T) => any

export function useMovable(el: HTMLElement | null): [boolean, number, number] {
	const [isDragging, setIsDragging] = useState(false)
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
		setIsDragging(false)
		ev.preventDefault()
	}, [])
	const onPointerDown = useCallback<HTMLElementEventHandler<PointerEvent>>(
		(ev) => {
			if (ev.pointerType === 'mouse' && ev.buttons !== 0b0001) {
				return
			}

			document.body.addEventListener('pointerup', onPointerUp)
			document.body.addEventListener('pointermove', onPointerMove)
			setIsDragging(true)
			setOriginPointerPosition({
				clientX: ev.clientX,
				clientY: ev.clientY,
			})
			setPointerPosition({
				clientX: ev.clientX,
				clientY: ev.clientY,
			})

			ev.preventDefault()
		},
		[onPointerUp]
	)

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
