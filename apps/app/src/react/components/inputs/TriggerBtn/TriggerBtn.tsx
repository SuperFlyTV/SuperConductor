import { Button } from '@mui/material'
import React from 'react'
import { BsKeyboardFill, BsKeyboard } from 'react-icons/bs'
import './style.scss'

export const TriggerBtn: React.FC<{
	className?: string
	onTrigger: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
	active: boolean
	title: string
	disabled?: boolean
	numTriggers?: number
}> = (props) => {
	const handleOnClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		props.onTrigger(e)
	}
	return (
		<Button
			variant="contained"
			color="primary"
			className={props.className}
			onClick={handleOnClick}
			title={props.title}
			size="small"
			disabled={props.disabled}
		>
			{props.active ? <BsKeyboardFill color="white" size={24} /> : <BsKeyboard color="white" size={24} />}
			{typeof props.numTriggers === 'number' && props.numTriggers > 0 && (
				<div className="triggercount">{props.numTriggers}</div>
			)}
		</Button>
	)
}
