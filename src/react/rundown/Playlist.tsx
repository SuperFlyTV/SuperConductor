import React from 'react'
import { Rundown } from './Rundown'

type PropsType = {
	children: React.ReactNode
}

export const Playlist = (props: PropsType) => {
	return (
		<div className="playlist">
			<div className="playlist__header">
				<div className="title">Group #1</div>
			</div>
			<div className="playlist__content">{props.children}</div>
		</div>
	)
}
