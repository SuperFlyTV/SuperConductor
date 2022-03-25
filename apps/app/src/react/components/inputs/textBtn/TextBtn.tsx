import React from 'react'

import './style.scss'

export const TextBtn: React.FC<{ label: string; onClick?: React.MouseEventHandler<HTMLButtonElement> | undefined }> = (
	props
) => {
	return (
		<button className="sc-btn" onClick={props.onClick}>
			{props.label}
		</button>
	)
}
