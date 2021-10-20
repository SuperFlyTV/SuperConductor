import classNames from 'classnames'
import React, { MouseEventHandler } from 'react'
import { BsFillPlayFill } from 'react-icons/bs'
import { FaStop } from 'react-icons/fa'

type PropsType = {
	onClick: MouseEventHandler<HTMLButtonElement>
	mode: 'play' | 'stop'
}

export const PlayControlBtn = (props: PropsType) => {
	return (
		<button className={classNames({ btn: true, [props.mode]: true })} onClick={props.onClick}>
			{props.mode === 'play' ? <BsFillPlayFill color="white" size={20} /> : <FaStop color="white" size={12} />}
		</button>
	)
}
