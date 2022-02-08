import { Button } from '@mui/material'
import classNames from 'classnames'
import React from 'react'
import { BsKeyboardFill, BsKeyboard } from 'react-icons/bs'

export const TriggerBtn: React.FC<{
	onTrigger: (active: boolean) => void
}> = (props) => {
	const [active, setActive] = React.useState(false)

	const handleOnClick = (_e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		props.onTrigger(!active)
		setActive(!active)
	}
	return (
		<Button variant="contained" color="primary" className={classNames('btn', 'btn--small')} onClick={handleOnClick}>
			{active ? <BsKeyboardFill color="white" size={24} /> : <BsKeyboard color="white" size={24} />}
		</Button>
	)
}
