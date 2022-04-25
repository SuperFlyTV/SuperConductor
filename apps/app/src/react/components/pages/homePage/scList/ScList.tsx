/* eslint-disable @typescript-eslint/no-unused-vars */
import classNames from 'classnames'
import React, { useEffect, useState } from 'react'
import { MdKeyboardArrowDown } from 'react-icons/md'
import './style.scss'

export const ScList: React.FC<{
	list: { id: string; header: React.ReactNode; content?: React.ReactNode }[]
	/** List of IDs that should be open by default */
	openByDefault?: string[]
}> = (props) => {
	return (
		<ul className="sc-list">
			{props.list.map((item) => {
				return (
					<ScListItem
						key={item.id}
						id={item.id}
						header={item.header}
						content={item.content}
						openByDefault={props.openByDefault?.includes(item.id)}
					/>
				)
			})}
		</ul>
	)
}

export const ScListItem: React.FC<{
	id: string
	header: React.ReactNode
	content?: React.ReactNode
	openByDefault?: boolean
}> = (props) => {
	const [isOpen, setOpen] = useState<boolean>(props.openByDefault ?? false)

	return (
		<li className={classNames('sc-list-item', { open: isOpen, openable: !!props.content })}>
			<div
				className="sc-list-item__header"
				onClick={() => {
					if (props.content) setOpen(!isOpen)
				}}
			>
				{props.content && (
					<div className="arrow">
						<MdKeyboardArrowDown />
					</div>
				)}
				<div className="sc-list-item__header__content">{props.header}</div>
			</div>

			{props.content && isOpen && <div className="sc-list-item__content">{props.content}</div>}
		</li>
	)
}
