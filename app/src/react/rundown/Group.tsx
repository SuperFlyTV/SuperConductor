import React from 'react'
import { Rundown } from './Rundown'

type PropsType = {
	children: React.ReactNode
}

export const Group = (props: PropsType) => {
	return (
		<div className="group">
			<div className="group__header">
				<div className="title">Group #1</div>
			</div>
			<div className="group__content">{props.children}</div>
		</div>
	)
}
