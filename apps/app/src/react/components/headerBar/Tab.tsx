import classNames from 'classnames'
import React from 'react'
import { TabLeftEdge } from './TabLeftEdge'
import { TabRightEdge } from './TabRightEdge'
// import { MdClose } from 'react-icons/md'
// import { IconButton } from '@mui/material'

export const Tab: React.FC<{
	id: string
	name: string
	selected?: boolean
	onClick: () => void
	onDoubleClick: () => void
}> = (props) => {
	return (
		<div
			className={classNames('tab', {
				selected: props.selected,
			})}
			title="Double-click to edit"
			onClick={props.onClick}
			onDoubleClick={props.onDoubleClick}
		>
			<TabLeftEdge />
			<div className="label">{props.name}</div>
			<TabRightEdge />
			{/* <IconButton
				color="error"
				title="Close Rundown"
				aria-label="close rundown"
				onClick={(event) => {
					// handleClose(rundown.rundownId)
					// onClose(rundown.rundownId)
					event.stopPropagation()
					event.preventDefault()
				}}
			>
				<MdClose />
			</IconButton> */}
		</div>
	)
}
