import React from 'react'

type PropsType = {
	percentage: string
}

export const PlayHead = (props: PropsType) => {
	return (
		<div className="playHead">
			<div className="shade" style={{ width: props.percentage }}></div>
			<div className="line" style={{ left: props.percentage }}></div>
		</div>
	)
}
