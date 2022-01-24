import React from 'react'
import { BsFillTrashFill } from 'react-icons/bs'

type PropsType = {
	onClick: () => void
}

export const TrashBtn = (props: PropsType) => {
	return (
		<div className="btn trash" onClick={props.onClick}>
			<BsFillTrashFill size={12} />
		</div>
	)
}
