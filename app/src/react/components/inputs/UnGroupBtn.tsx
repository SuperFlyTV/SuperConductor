import React, { MouseEventHandler } from 'react'
import { ImUngroup } from 'react-icons/im'

export const UnGroupBtn: React.FC<{
	onClick: MouseEventHandler<HTMLButtonElement>
	disabled?: boolean
}> = (props) => {
	const handleOnClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		if (!props.disabled) {
			props.onClick(e)
		}
	}
	return (
		<button className="btn un-group" onClick={handleOnClick} disabled={props.disabled}>
			<ImUngroup color="white" size={20} />
		</button>
	)
}
