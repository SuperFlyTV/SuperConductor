import React from 'react'
import { IoIosHelpCircleOutline } from 'react-icons/io'
import { IoClose } from 'react-icons/io5'

import './style.scss'

export const Message: React.FC<{ content?: React.ReactNode; type: 'help' | 'warning'; onClose?: () => void }> = (
	props
) => {
	return (
		<div className={`message ${props.type}`}>
			<div className="icon">
				<IoIosHelpCircleOutline />
			</div>
			<div className="content">{props.content || props.children}</div>
			{props.onClose && (
				<button className="close" onClick={props.onClose}>
					<IoClose />
				</button>
			)}
		</div>
	)
}
