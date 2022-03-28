import classNames from 'classnames'
import React from 'react'
import { MdClose } from 'react-icons/md'

import './style.scss'

export const Tab: React.FC<{
	id: string
	name: string
	active?: boolean
	onClick: () => void
	onDoubleClick?: () => void
	onClose?: (id: string) => void
	disableClose?: boolean
	icon?: React.ReactNode
	showSeparator?: boolean
}> = (props) => {
	return (
		<div
			className={classNames('tab', {
				active: props.active,
			})}
			title="Double-click to edit"
			onClick={props.onClick}
			onDoubleClick={props.onDoubleClick}
		>
			{props.icon && <div className="icon">{props.icon}</div>}
			<div className="label">{props.name}</div>
			{!props.disableClose && (
				<div className="close">
					<button
						title="Close Rundown"
						aria-label="close rundown"
						onClick={(event) => {
							if (props.onClose) props.onClose(props.id)
							event.stopPropagation()
							event.preventDefault()
						}}
					>
						<MdClose />
					</button>
				</div>
			)}
			{props.showSeparator && <div className="separator" />}
		</div>
	)
}
