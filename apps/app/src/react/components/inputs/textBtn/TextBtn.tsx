import React from 'react'

import './style.scss'

export const TextBtn: React.FC<{
	label: string
	style?: 'normal' | 'warning' | 'danger'
	onClick?: React.MouseEventHandler<HTMLButtonElement>
}> = (props) => {
	return (
		<button className={'sc-btn ' + (props.style ? props.style : 'normal')} onClick={props.onClick}>
			{props.label}
		</button>
	)
}
