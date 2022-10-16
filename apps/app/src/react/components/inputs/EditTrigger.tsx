import { Button, ButtonGroup } from '@mui/material'

import React from 'react'

import { ApplicationTrigger, RundownTrigger } from '../../../models/rundown/Trigger'
import { MdPlayArrow, MdStop } from 'react-icons/md'
import { BsTrash } from 'react-icons/bs'
import classNames from 'classnames'
import { assertNever } from '@shared/lib'

const ACTION_ICON_SIZE = 12

export const NoEditTrigger: React.FC<{
	trigger: RundownTrigger
	label?: string
}> = ({ trigger, label }) => {
	let triggerAction: JSX.Element
	if (trigger.action === 'play') {
		triggerAction = <MdPlayArrow size={ACTION_ICON_SIZE} />
	} else if (trigger.action === 'stop') {
		triggerAction = <MdStop size={ACTION_ICON_SIZE} />
	} else if (trigger.action === 'playStop') {
		triggerAction = (
			<>
				<MdPlayArrow size={ACTION_ICON_SIZE} />
				<MdStop size={ACTION_ICON_SIZE} />
			</>
		)
	} else {
		assertNever(trigger.action)
		triggerAction = <></>
	}

	return (
		<div className={'trigger'}>
			{label && <div className="field label">{label}</div>}
			<div className="field">
				<span className="label__action">{triggerAction}</span>
			</div>
			<TriggerPill trigger={trigger} />
		</div>
	)
}

export const EditRundownTrigger: React.FC<{
	trigger: RundownTrigger
	index: number
	onEdit: (index: number, trigger: RundownTrigger | null) => void
	locked?: boolean
}> = ({ trigger, index, onEdit, locked }) => {
	return (
		<div className={classNames('trigger', { 'trigger--locked': locked })}>
			<div className="field">
				<Button
					variant="contained"
					disabled={locked}
					onClick={() => {
						// handleClose()
						onEdit(index, null)
					}}
					color="error"
					title="Delete Trigger"
					size="small"
				>
					<BsTrash size={ACTION_ICON_SIZE} />
				</Button>
			</div>
			<div className="field">
				<ButtonGroup className="trigger__buttons__triggerType">
					<Button
						variant="contained"
						onClick={() => {
							onEdit(index, { ...trigger, action: 'play' })
						}}
						color={trigger.action === 'play' ? 'primary' : 'inherit'}
						title={(trigger.action === 'play' ? '' : 'Set trigger to ') + 'Play-mode'}
						size="small"
					>
						<MdPlayArrow size={ACTION_ICON_SIZE} />
					</Button>
					<Button
						variant="contained"
						onClick={() => {
							onEdit(index, { ...trigger, action: 'stop' })
						}}
						color={trigger.action === 'stop' ? 'primary' : 'inherit'}
						title={(trigger.action === 'stop' ? '' : 'Set trigger to ') + 'Stop-mode'}
						size="small"
					>
						<MdStop size={ACTION_ICON_SIZE} />
					</Button>
					<Button
						variant="contained"
						onClick={() => {
							onEdit(index, { ...trigger, action: 'playStop' })
						}}
						color={trigger.action === 'playStop' ? 'primary' : 'inherit'}
						title={(trigger.action === 'playStop' ? '' : 'Set trigger to ') + 'Play/Stop-mode'}
						size="small"
					>
						<MdPlayArrow size={ACTION_ICON_SIZE} />
						<MdStop size={ACTION_ICON_SIZE} />
					</Button>
				</ButtonGroup>
			</div>

			<TriggerPill trigger={trigger} />
		</div>
	)
}

export const EditApplicationTrigger: React.FC<{
	trigger: ApplicationTrigger
	index: number
	onEdit?: (index: number, trigger: ApplicationTrigger | null) => void
}> = ({ trigger, index, onEdit }) => {
	return (
		<div className={classNames('trigger')}>
			{onEdit && (
				<div className="field">
					<Button
						variant="contained"
						onClick={() => {
							onEdit(index, null)
						}}
						color="error"
						title="Delete Trigger"
						size="small"
					>
						<BsTrash size={ACTION_ICON_SIZE} />
					</Button>
				</div>
			)}

			<TriggerPill trigger={trigger} />
		</div>
	)
}
export const TriggerPill: React.FC<{
	trigger: ApplicationTrigger
}> = ({ trigger }) => {
	const labelParts = trigger.label.split('+')

	return (
		<div className="trigger-pill">
			{labelParts.map((part, index) => {
				const isKeyboard = trigger.fullIdentifiers[index]?.startsWith('keyboard')
				return (
					<React.Fragment key={index}>
						<div className={classNames('label-part', { keyboard: isKeyboard })}>
							<span className="label">{part}</span>
						</div>
						<span className="connect-labels">+</span>
					</React.Fragment>
				)
			})}
		</div>
	)
}
