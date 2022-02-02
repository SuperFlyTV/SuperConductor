import { Button } from '@mui/material'
import React from 'react'
import { BsTrash } from 'react-icons/bs'

type PropsType = {
	onClick: () => void
}

export const TrashBtn = (props: PropsType) => {
	return (
		<Button className="btn btn--small" variant="contained" onClick={props.onClick} color="error">
			<BsTrash size={14} />
		</Button>
	)
}
