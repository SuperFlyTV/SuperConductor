import React from 'react'

type PropsType = {
	percentage: string
}

export const PlayHead = (props: PropsType) => {
	return (
		<div className="playHead" style={{ left: props.percentage }}>
			<div className="line"></div>
		</div>
	)
}
