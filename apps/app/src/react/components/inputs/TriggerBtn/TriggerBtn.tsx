import React from 'react'
import { BsKeyboardFill, BsKeyboard } from 'react-icons/bs'
import { ToggleBtn } from '../ToggleBtn/ToggleBtn.js'
import './style.scss'

export const TriggerBtn: React.FC<{
	className?: string
	onTrigger: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
	disabled?: boolean
	triggerCount: number
	locked: boolean
	anyGlobalTriggerFailed: boolean
}> = (props) => {
	const handleOnClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		props.onTrigger(e)
	}

	const color = props.anyGlobalTriggerFailed ? 'red' : 'white'

	if (props.locked && props.triggerCount === 0) return null

	return (
		<ToggleBtn
			title={
				'Assign triggers' +
				(props.anyGlobalTriggerFailed
					? '\n\nWARNING: One or more global triggers failed to register and will not work! This is likely because another application has already registered the same hotkey. Click this button to see which ones failed (their globe icons will be red).'
					: '')
			}
			disabled={false}
			selected={props.triggerCount > 0}
			size="small"
			onChange={handleOnClick}
		>
			{props.triggerCount > 0 ? (
				<>
					<BsKeyboardFill color={color} size={24} />
					<div className="triggercount">{props.triggerCount}</div>
				</>
			) : (
				<BsKeyboard color={color} size={24} />
			)}
		</ToggleBtn>
	)
}
