/* eslint-disable @typescript-eslint/no-unused-vars */
import classNames from 'classnames'
import React, { useEffect, useState } from 'react'
import { MdKeyboardArrowDown } from 'react-icons/md'
import './style.scss'

export const ScList: React.FC<{
	list: { id: string; header: React.ReactNode; content?: React.ReactNode; openByDefault?: boolean }[]
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
						openByDefault={item.openByDefault}
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
	const [isOpen, setOpen] = useState(props.openByDefault)

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
