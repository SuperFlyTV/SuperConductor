import { Button } from '@mui/material'
import classNames from 'classnames'
import React from 'react'
import { BsKeyboardFill, BsKeyboard } from 'react-icons/bs'

export const TriggerBtn: React.FC<{
	onTrigger: () => void
	active: boolean
}> = (props) => {
	const handleOnClick = (_e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		props.onTrigger()
	}
	return (
		<Button variant="contained" color="primary" className={classNames('btn', 'btn--small')} onClick={handleOnClick}>
			{props.active ? <BsKeyboardFill color="white" size={24} /> : <BsKeyboard color="white" size={24} />}
		</Button>
	)
}
