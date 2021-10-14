import classNames from 'classnames'
import React, { MouseEventHandler } from 'react'
import { BsFillPlayFill, BsPauseFill } from 'react-icons/bs'

type PropsType = {
	onClick: MouseEventHandler<HTMLButtonElement>
	mode: 'play' | 'stop'
}

export const PlayControlBtn = (props: PropsType) => {
	return (
		<button className={classNames({ btn: true, [props.mode]: true })} onClick={props.onClick}>
			{props.mode === 'play' ? <BsFillPlayFill color="white" size={20} /> : <BsPauseFill color="white" size={20} />}
		</button>
	)
}
