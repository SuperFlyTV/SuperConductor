import { Button } from '@mui/material'
import React from 'react'
import { BsPlusLg } from 'react-icons/bs'

export const AddBtn = (props: {
	className?: string
	disabled?: boolean
	title: string
	onClick: () => void
}): JSX.Element => {
	return (
		<Button
			className={props.className}
			variant="contained"
			size="small"
			onClick={props.onClick}
			color="primary"
			title={props.title}
			disabled={props.disabled}
		>
			<BsPlusLg size={12} />
		</Button>
	)
}
