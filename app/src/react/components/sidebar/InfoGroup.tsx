import React from 'react'

export const InfoGroup = (props: { title: string; children: React.ReactNode }) => {
	return (
		<div className="info-group">
			<div className="title">{props.title}</div>
			<div className="content">{props.children}</div>
		</div>
	)
}
