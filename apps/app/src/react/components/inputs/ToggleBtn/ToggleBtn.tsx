import React from 'react'
import classNames from 'classnames'
import './style.scss'
// This is an element intended to be used as the ToggleButton exposed by mui/Button
// The reason for this existing is that the Button renders quite slowly...
export const ToggleBtn: React.FC<{
	className?: string
	onChange: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
	title?: string
	selected?: boolean
	disabled?: boolean
	size?: string
}> = (props) => {
	return (
		<button
			className={classNames(
				'toggle-btn',
				{
					selected: props.selected,
					disabled: props.disabled,
				},
				props.className,
				props.size && `size-${props.size}`
			)}
			title={props.title}
			value="triggers"
			disabled={false}
			onClick={(e) => {
				props.onChange(e)
			}}
		>
			{props.children}
		</button>
	)
}
