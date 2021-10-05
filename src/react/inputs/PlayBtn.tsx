import React from 'react'
import { BsFillPlayFill } from 'react-icons/bs'

type PropsType = {}

export const PlayBtn = () => {
	return (
		<button className="btn play">
			<span>Play</span>
			<BsFillPlayFill />
		</button>
	)
}
