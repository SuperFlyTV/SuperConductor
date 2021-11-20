import classNames from 'classnames'
import React, { MouseEventHandler } from 'react'
import { BsFillPlayFill } from 'react-icons/bs'
import { FaStop } from 'react-icons/fa'

export const PlayControlBtn: React.FC<{
	onClick: MouseEventHandler<HTMLButtonElement>
	mode: 'play' | 'stop'
	disabled?: boolean
}> = (props) => {
	const handleOnClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		if (!props.disabled) {
			props.onClick(e)
		}
	}
	return (
		<button className={classNames({ btn: true, [props.mode]: true })} onClick={handleOnClick} disabled={props.disabled}>
			{props.mode === 'play' ? <BsFillPlayFill color="white" size={20} /> : <FaStop color="white" size={12} />}
		</button>
	)
}
