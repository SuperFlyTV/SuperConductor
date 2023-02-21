import React from 'react'
import classNames from 'classnames'
import './style.scss'

// This is an element intended to be used as the Button exposed by mui/Button
// The reason for this existing is that the Button renders quite slowly...
export const Btn: React.FC<{
	className?: string
	onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
	title?: string
	selected?: boolean
	disabled?: boolean
	size?: string
	variant?: 'contained'
	children: React.ReactNode
}> = (props) => {
	return (
		<button
			className={classNames(
				'btn',
				{
					disabled: props.disabled,
				},
				props.className,
				props.size && `size-${props.size}`,
				props.variant && `variant-${props.variant}`
			)}
			title={props.title}
			value="triggers"
			disabled={false}
			onClick={(e) => {
				props.onClick?.(e)
			}}
		>
			{props.children}
		</button>
	)
}
