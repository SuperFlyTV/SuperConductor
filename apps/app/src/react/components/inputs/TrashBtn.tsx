import { Button } from '@mui/material'
import React from 'react'
import { BsTrash } from 'react-icons/bs'

type PropsType = {
	className?: string
	disabled?: boolean
	title: string
	onClick: () => void
}

export const TrashBtn = (props: PropsType): JSX.Element => {
	return (
		<Button
			className={props.className}
			variant="contained"
			size="small"
			onClick={props.onClick}
			color="error"
			title={props.title}
			disabled={props.disabled}
		>
			<BsTrash size={12} />
		</Button>
	)
}
