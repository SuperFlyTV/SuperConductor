import React from 'react'

export const TextBtn: React.FC<{ label: string }> = (props) => {
	return <button className="sc-btn">{props.label}</button>
}
