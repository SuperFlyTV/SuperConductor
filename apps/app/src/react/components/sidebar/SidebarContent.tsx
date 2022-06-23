import React, { useEffect, useRef } from 'react'
import classNames from 'classnames'

export const SidebarContent: React.FC<{
	title: string | React.ReactNode
	className: string
	children: React.ReactNode
}> = (props) => {
	const header = useRef<HTMLDivElement | null>()

	const [headerHeight, setHeaderHeight] = React.useState<number | undefined>(undefined)

	useEffect(() => {
		if (header.current) {
			const height = header.current.offsetHeight

			setHeaderHeight(height)
		}
	}, [])

	return (
		<div className={classNames('sidebar', props.className)}>
			<div
				className="sidebar__header"
				ref={(el) => {
					header.current = el
				}}
			>
				{typeof props.title === 'string' ? <span className="title">{props.title}</span> : props.title}
			</div>
			{headerHeight !== undefined && (
				<div className="sidebar__content" style={{ top: headerHeight }}>
					{props.children}
				</div>
			)}
		</div>
	)
}
