import { Button } from '@mui/material'
import React from 'react'
import { BsKeyboardFill, BsKeyboard } from 'react-icons/bs'

export const TriggerBtn: React.FC<{
	className?: string
	onTrigger: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
	active: boolean
	title: string
	disabled?: boolean
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
		</Button>
	)
}
