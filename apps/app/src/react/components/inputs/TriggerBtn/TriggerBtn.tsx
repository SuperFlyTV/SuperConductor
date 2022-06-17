import React from 'react'
import { BsKeyboardFill, BsKeyboard } from 'react-icons/bs'
import { ToggleBtn } from '../ToggleBtn/ToggleBtn'
import './style.scss'

export const TriggerBtn: React.FC<{
	className?: string
	onTrigger: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
	title: string
	disabled?: boolean
	triggerCount: number
	locked: boolean
}> = (props) => {
	const handleOnClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		props.onTrigger(e)
	}

	if (props.locked && props.triggerCount === 0) return null

	return (
		<ToggleBtn
			title={'Assign triggers'}
			disabled={false}
			selected={props.triggerCount > 0}
			size="small"
			onChange={handleOnClick}
		>
			{props.triggerCount > 0 ? (
				<>
					<BsKeyboardFill color="white" size={24} />
					<div className="triggercount">{props.triggerCount}</div>
				</>
			) : (
				<BsKeyboard color="white" size={24} />
			)}
		</ToggleBtn>
	)
}
