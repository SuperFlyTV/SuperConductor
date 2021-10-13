import React, { MouseEventHandler } from 'react'
import { BsFillPlayFill } from 'react-icons/bs'

type PropsType = {
	onClick: MouseEventHandler<HTMLButtonElement>
}

export const PlayBtn = (props: PropsType) => {
	return (
		<button className="btn play" onClick={props.onClick}>
			<span>Play</span>
			<BsFillPlayFill />
		</button>
	)
}
