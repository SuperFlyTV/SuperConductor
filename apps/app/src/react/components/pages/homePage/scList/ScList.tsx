/* eslint-disable @typescript-eslint/no-unused-vars */
import classNames from 'classnames'
import React, { useState } from 'react'
import { MdKeyboardArrowDown } from 'react-icons/md'
import './style.scss'

export const ScList: React.FC<{ list: { id: string; header: React.ReactNode; content?: React.ReactNode }[] }> = (
	props
) => {
	return (
		<ul className="sc-list">
			{props.list.map((item) => {
				if (item.content) {
					return <ScListItem key={item.id} id={item.id} header={item.header} content={item.content} />
				}
				return <li key={item.id}>{item.header}</li>
			})}
		</ul>
	)
}

export const ScListItem: React.FC<{ id: string; header: React.ReactNode; content?: React.ReactNode }> = (props) => {
	const [isOpen, setOpen] = useState(true)

	if (props.content) {
		return (
			<li className={classNames('sc-list-item', { open: isOpen })}>
				<div className="header" onClick={() => setOpen(!isOpen)}>
					<div className="arrow">
						<MdKeyboardArrowDown />
					</div>
					<div className="header-content">{props.header}</div>
				</div>
				{isOpen && <div className="content">{props.content}</div>}
			</li>
		)
	}
	return <li className="sc-list-item">{props.header}</li>
}
