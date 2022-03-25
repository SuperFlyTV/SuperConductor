import React, { useState } from 'react'
import { IoIosHelpCircle } from 'react-icons/io'

import './style.scss'

// WIP
export const ProjectPageLayout: React.FC<{
	title: string
	subtitle?: string
	help?: React.ReactNode
	controls?: React.ReactNode
}> = (props) => {
	const [showHelp, setShowHelp] = useState(false)

	return (
		<div className="main">
			<div className="header">
				<div className="titles">
					<div className="subtitle">{props.subtitle}</div>
					<div className="title">{props.title}</div>
				</div>
				{props.controls && <div className="controls">{props.controls}</div>}
				<button
					className="help"
					onClick={() => {
						setShowHelp(!showHelp)
					}}
				>
					<IoIosHelpCircle />
				</button>
			</div>
			{showHelp && props.help && <div className="message help">{props.help}</div>}
			<div className="content">{props.children}</div>
		</div>
	)
}
