import React from 'react'
import { BiAddToQueue } from 'react-icons/bi'

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
			<span>Queue</span>
			<BiAddToQueue />
			{label ?? null}
		</button>
	)
}
