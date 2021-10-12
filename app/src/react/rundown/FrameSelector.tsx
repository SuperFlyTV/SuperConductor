import React from 'react'

type PropsType = {
	frame: number
}

export const FrameSelector = (props: PropsType) => {
	return (
		<div className="frame-selector" style={{ left: props.frame }}>
			<div className="head">{props.frame}</div>
			<div className="line"></div>
		</div>
	)
}
