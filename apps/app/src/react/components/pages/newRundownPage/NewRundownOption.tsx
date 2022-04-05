import { observer } from 'mobx-react-lite'
import React from 'react'

import './newRundownOption.scss'

export const NewRundownOption: React.FC<{ label: string; icon: React.ReactNode; onClick: () => void }> = observer(
	function NewRundownOption(props) {
		return (
			<button className="new-rundown-option" onClick={props.onClick}>
				<div className="icon">{props.icon}</div>
				<div className="label">{props.label}</div>
			</button>
		)
	}
)
