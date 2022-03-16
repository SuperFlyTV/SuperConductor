import classNames from 'classnames'
import React from 'react'

import './projectPageLayout.scss'

export const ProjectPageLayout: React.FC<{
	pages: { label: string; id: string; content: React.ReactNode }[]
	activePageId?: string
	onPageClick: (pageId: string) => void
}> = (props) => {
	let activePage = props.pages.find((page) => page.id === props.activePageId)
	if (!activePage) {
		activePage = props.pages[0]
	}

	return (
		<div className="project-page-layout">
			<div className="menubar">
				{props.pages.map((page) => {
					const isActive = page.id === props.activePageId
					return (
						<div
							key={page.id}
							className={classNames('item', { active: isActive })}
							onClick={() => props.onPageClick(page.id)}
						>
							{page.label}
						</div>
					)
				})}
			</div>
			<div className="main">
				<div className="title">{activePage.label}</div>
				<div className="content">{activePage?.content}</div>
			</div>
		</div>
	)
}
