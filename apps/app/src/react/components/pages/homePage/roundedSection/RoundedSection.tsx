import React, { useState } from 'react'
import { HelpButton } from '../../../inputs/HelpButton/HelpButton'
import { Message } from '../message/Message'

import './style.scss'

export const RoundedSection: React.FC<{
	title: React.ReactNode
	controls?: React.ReactNode
	help?: string
	children: React.ReactNode
}> = (props) => {
	const [showHelp, setShowHelp] = useState(false)

	return (
		<div className="rounded-section">
			<div className="header">
				<div className="title">{props.title}</div>
				{props.controls && <div className="controls">{props.controls}</div>}
				<div className="fake-border" />
				{props.help && (
					<HelpButton
						showHelp={showHelp}
						onClick={() => {
							setShowHelp(!showHelp)
						}}
					/>
				)}
			</div>
			<div className="border-cropper">
				<div className="border">
					{showHelp && props.help && (
						<div className="message-wrapper">
							<Message type="help" content={props.help} onClose={() => setShowHelp(false)} />
						</div>
					)}
					{props.children}
				</div>
			</div>
		</div>
	)
}
