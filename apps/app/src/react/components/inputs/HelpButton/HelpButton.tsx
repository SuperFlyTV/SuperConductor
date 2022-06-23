import classNames from 'classnames'
import React from 'react'
import { FiHelpCircle } from 'react-icons/fi'

import './style.scss'

export const HelpButton: React.FC<{ showHelp: boolean; onClick: () => void }> = (props) => {
	return (
		<button
			className={classNames('help-button', { open: props.showHelp })}
			onClick={() => {
				props.onClick()
			}}
		>
			<FiHelpCircle />
		</button>
	)
}
