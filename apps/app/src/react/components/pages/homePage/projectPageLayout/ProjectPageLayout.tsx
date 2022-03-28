import classNames from 'classnames'
import React, { useState } from 'react'
import { IoClose } from 'react-icons/io5'
import { FiHelpCircle } from 'react-icons/fi'

import './style.scss'
import { IoIosHelpCircleOutline } from 'react-icons/io'

// WIP
export const ProjectPageLayout: React.FC<{
	title: string
	subtitle?: string
	help?: React.ReactNode
	controls?: React.ReactNode
}> = (props) => {
	const [showHelp, setShowHelp] = useState(true)

	return (
		<div className="main">
			<div className="header">
				<div className="titles">
					<div className="subtitle">{props.subtitle}</div>
					<div className="title">{props.title}</div>
				</div>
				{props.controls && <div className="controls">{props.controls}</div>}
				{props.help && (
					<button
						className={classNames('help', { open: showHelp })}
						onClick={() => {
							setShowHelp(!showHelp)
						}}
					>
						<FiHelpCircle />
					</button>
				)}
			</div>
			{showHelp && props.help && (
				<div className="message help">
					<div className="icon">
						<IoIosHelpCircleOutline />
					</div>
					<div className="content">{props.help}</div>
					<button className="close" onClick={() => setShowHelp(false)}>
						<IoClose />
					</button>
				</div>
			)}
			<div className="content">{props.children}</div>
		</div>
	)
}
