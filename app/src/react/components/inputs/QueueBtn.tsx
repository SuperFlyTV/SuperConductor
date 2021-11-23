import React from 'react'
import { BiAddToQueue, BiTrash } from 'react-icons/bi'

export const QueueBtn: React.FC<{
	label: string
	onClick: React.MouseEventHandler<HTMLButtonElement>
	disabled?: boolean
}> = ({ label, onClick, disabled }) => {
	const handleOnClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		if (!disabled) {
			onClick(e)
		}
	}
	return (
		<button className="btn queue" onClick={handleOnClick} disabled={disabled}>
			<span className="label">
				{label || (
					<>
						Queue&nbsp;
						<BiAddToQueue />
					</>
				)}
			</span>
		</button>
	)
}

export const UnQueueBtn: React.FC<{
	label: string
	onClick: React.MouseEventHandler<HTMLButtonElement>
	disabled?: boolean
}> = ({ label, onClick, disabled }) => {
	const handleOnClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		if (!disabled) {
			onClick(e)
		}
	}
	return (
		<button className="btn un-queue" onClick={handleOnClick} disabled={disabled}>
			<span className="label">
				<BiTrash /> {label || ''}
			</span>
		</button>
	)
}
