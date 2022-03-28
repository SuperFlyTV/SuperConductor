import React from 'react'

import './style.scss'

export const RoundedSection: React.FC<{ title: string }> = (props) => {
	return (
		<div className="rounded-section">
			<div className="header">
				<div className="title">{props.title}</div>
				<div className="fake-border" />
			</div>
			<div className="border-cropper">
				<div className="border">{props.children}</div>
			</div>
		</div>
	)
}
