import classNames from 'classnames'
import React, { useState } from 'react'
import { FiHelpCircle } from 'react-icons/fi'
import { Message } from '../message/Message'
import './style.scss'

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
				{props.controls && <div className="controls">{props.controls}</div>}
			</div>
			{showHelp && props.help && <Message type="help" content={props.help} onClose={() => setShowHelp(false)} />}
			<div className="content">{props.children}</div>
		</div>
	)
}
