import React from 'react'

type PropsType = {
	frame: number
	percentage: string
}

export const PlayHead = (props: PropsType) => {
	return (
		<div className="playHead" style={{ left: props.percentage }}>
			<div className="head">{props.frame}</div>
			<div className="line"></div>
		</div>
	)
}
