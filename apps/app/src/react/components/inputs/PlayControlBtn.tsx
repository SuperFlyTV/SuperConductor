import { Button } from '@mui/material'
import classNames from 'classnames'
import React, { MouseEventHandler } from 'react'
import { BsPlay, BsStop } from 'react-icons/bs'

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
		<Button
			variant="contained"
			color="primary"
			className={classNames('btn', 'btn--small', { [props.mode]: true })}
			onClick={handleOnClick}
			disabled={props.disabled}
		>
			{props.mode === 'play' ? <BsPlay color="white" size={24} /> : <BsStop color="white" size={20} />}
		</Button>
	)
}
