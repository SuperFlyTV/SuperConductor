import classNames from 'classnames'
import React, { useContext, useEffect } from 'react'
import { AiOutlineCloseSquare } from 'react-icons/ai'
import { HotkeyContext } from '../../contexts/Hotkey'

type PropsType = {
	children: React.ReactNode
	className?: React.HTMLAttributes<HTMLElement>['className']
	title?: string
	onClose: () => void
}

export const Popup = (props: PropsType) => {
	const keyTracker = useContext(HotkeyContext)

	// Close the popup when Escape is pressed.
	useEffect(() => {
		const onKey = () => {
			const pressed = keyTracker.getPressedKeys()
			if (pressed.includes('Escape')) {
				props.onClose()
			}
		}
		onKey()

		keyTracker.bind('Escape', onKey, {
			up: false,
			global: true,
		})
		keyTracker.bind('Escape', onKey, {
			up: true,
			global: true,
		})

		return () => {
			keyTracker.unbind('Escape', onKey)
		}
	}, [])

	return (
		<div className={classNames('popup-shade', props.className)}>
			<dialog open className="popup">
				<div className="popup__header">
					<div className="popup__header__title">{props.title}</div>
					<button onClick={props.onClose}>
						<AiOutlineCloseSquare size={25} />
					</button>
				</div>
				<div className="popup__content">{props.children}</div>
			</dialog>
		</div>
	)
}
