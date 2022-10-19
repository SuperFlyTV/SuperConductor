import React from 'react'
import classNames from 'classnames'

export const SidebarContent: React.FC<{
	title: string | React.ReactNode
	className: string
	children: React.ReactNode
}> = (props) => {
	return (
		<div className={classNames('sidebar', props.className)}>
			<div className="sidebar__header">
				{typeof props.title === 'string' ? <span className="title">{props.title}</span> : props.title}
			</div>
			<div className="sidebar__content">{props.children}</div>
		</div>
	)
}
