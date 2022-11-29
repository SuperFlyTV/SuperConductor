import { Button } from '@mui/material'
import React from 'react'
import { IoDuplicateOutline } from 'react-icons/io5'

type PropsType = {
	className?: string
	disabled?: boolean
	title: string
	onClick: () => void
}

export const DuplicateBtn = function DuplicateBtn(props: PropsType): JSX.Element {
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
			<IoDuplicateOutline size={18} />
		</Button>
	)
}
