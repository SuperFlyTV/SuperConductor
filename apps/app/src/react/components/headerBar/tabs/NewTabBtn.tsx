import React from 'react'
import { MdAdd } from 'react-icons/md'

export const NewTabBtn: React.FC<{ onClick: () => void }> = (props) => {
	return (
		<button
			className="new-tab-button"
			title="Create/Open Rundown"
			aria-label="open or create new rundown"
			onClick={props.onClick}
		>
			<MdAdd />
		</button>
	)
}
