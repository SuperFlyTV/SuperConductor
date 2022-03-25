import classNames from 'classnames'
import React from 'react'

import './style.scss'

export const ProjectPageMenubar: React.FC<{
	menubar: {
		groupId: string
		items: {
			label: string
			id: string
			icon?: React.ReactNode
		}[]
	}[]
	activeItemId?: string
	onItemClick: (itemId: string) => void
}> = (props) => {
	return (
		<div className="menubar">
			{props.menubar.map((group) => {
				return (
					<div key={group.groupId} className="menubar__group">
						{group.items.map((item) => {
							const isActive = item.id === props.activeItemId
							return (
								<div
									key={item.id}
									className={classNames('item', { active: isActive })}
									onClick={() => props.onItemClick(item.id)}
								>
									{item.icon && <div className="icon">{item.icon}</div>}
									<div className="label">{item.label}</div>
								</div>
							)
						})}
						<div className="separator" />
					</div>
				)
			})}
		</div>
	)
}
