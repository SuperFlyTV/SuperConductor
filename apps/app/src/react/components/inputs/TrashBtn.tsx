import { Button } from '@mui/material'
import React from 'react'
import { BsTrash } from 'react-icons/bs'

type PropsType = {
	className?: string
	onClick: () => void
}

export const TrashBtn = (props: PropsType) => {
	return (
		<Button
			className={props.className}
			variant="contained"
			size="small"
			onClick={props.onClick}
			color="error"
			title="Delete"
		>
			<BsTrash size={14} />
		</Button>
	)
}
