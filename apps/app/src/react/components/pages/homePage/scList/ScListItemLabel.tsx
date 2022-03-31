import React from 'react'

export const ScListItemLabel: React.FC<{ title: string; subtitle?: string }> = (props) => {
	return (
		<div className="header-label">
			<div className="title">{props.title}</div>
			{props.subtitle && <div className="subtitle">{props.subtitle}</div>}
		</div>
	)
}
