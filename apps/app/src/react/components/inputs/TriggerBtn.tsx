import { Button } from '@mui/material'
import React from 'react'
import { BsKeyboardFill, BsKeyboard } from 'react-icons/bs'

export const TriggerBtn: React.FC<{
	className?: string
	onTrigger: () => void
	active: boolean
	title: string
}> = (props) => {
	const handleOnClick = (_e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		props.onTrigger()
	}
	return (
		<Button
			variant="contained"
			color="primary"
			className={props.className}
			onClick={handleOnClick}
			title={props.title}
			size="small"
		>
			{props.active ? <BsKeyboardFill color="white" size={24} /> : <BsKeyboard color="white" size={24} />}
		</Button>
	)
}
