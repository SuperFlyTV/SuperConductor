import classNames from 'classnames'
import React from 'react'
import { MdClose } from 'react-icons/md'
import { TabLeftEdge } from './TabLeftEdge'
import { TabRightEdge } from './TabRightEdge'

export const Tab: React.FC<{
	id: string
	name: string
	selected?: boolean
	onClick: () => void
	onDoubleClick: () => void
	onClose: (id: string) => void
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
			<div className="close">
				<button
					title="Close Rundown"
					aria-label="close rundown"
					onClick={(event) => {
						props.onClose(props.id)
						event.stopPropagation()
						event.preventDefault()
					}}
				>
					<MdClose />
				</button>
			</div>
			<TabRightEdge />
		</div>
	)
}
