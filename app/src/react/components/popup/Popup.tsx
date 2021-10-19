import React from 'react'
import { AiOutlineCloseSquare } from 'react-icons/Ai'

type PropsType = {
	children: React.ReactNode
	onClose: () => void
}

export const Popup = (props: PropsType) => {
	return (
		<div className="popup-shade">
			<div className="popup">
				<div className="popup__header">
					<button onClick={props.onClose}>
						<AiOutlineCloseSquare size={25} />
					</button>
				</div>
				<div className="popup__content">{props.children}</div>
			</div>
		</div>
	)
}
