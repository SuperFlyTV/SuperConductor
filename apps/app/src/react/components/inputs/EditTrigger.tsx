import { Button, ButtonGroup, ToggleButton } from '@mui/material'

import React from 'react'

import { ApplicationTrigger, RundownTrigger } from '../../../models/rundown/Trigger'
import { MdPlayArrow, MdStop } from 'react-icons/md'
import { BsTrash } from 'react-icons/bs'
import { IoMdGlobe } from 'react-icons/io'
import classNames from 'classnames'
import { convertSorensenToElectron } from '../../../lib/util'

const ACTION_ICON_SIZE = 12

export const NoEditTrigger: React.FC<{
	trigger: RundownTrigger
}> = ({ trigger }) => {
	const labelParts = trigger.label.split('+')

	return (
		<div className={'trigger'}>
			<div className="field">Button area</div>
			<div className="field label">
				<span className="label__action">
					{trigger.action === 'play' ? (
						<MdPlayArrow size={ACTION_ICON_SIZE} />
					) : trigger.action === 'stop' ? (
						<MdStop size={ACTION_ICON_SIZE} />
					) : trigger.action === 'playStop' ? (
						<>
							<MdPlayArrow size={ACTION_ICON_SIZE} />
							<MdStop size={ACTION_ICON_SIZE} />
						</>
					) : null}
				</span>
				{labelParts.map((part, index) => {
					const isKeyboard = trigger.fullIdentifiers[index]?.startsWith('keyboard')
					return (
						<React.Fragment key={index}>
							<div className={classNames('label__key', { 'label__key--keyboard': isKeyboard })}>
								<span className="label__key__text">{part}</span>
							</div>
							<span className="label__plus">+</span>
						</React.Fragment>
					)
				})}
			</div>
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
				<TriggerGlobalToggle
					isGlobal={trigger.isGlobalKeyboard}
					onChange={() => {
						onEdit(index, {
							...trigger,
							isGlobalKeyboard: !trigger.isGlobalKeyboard,
						})
					}}
				/>
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
				<>
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

					<div className="field">
						<TriggerGlobalToggle
							isGlobal={trigger.isGlobalKeyboard}
							onChange={() => {
								onEdit(index, {
									...trigger,
									isGlobalKeyboard: !trigger.isGlobalKeyboard,
								})
							}}
						/>
					</div>
				</>
			)}

			<TriggerPill trigger={trigger} />
		</div>
	)
}
export const TriggerPill: React.FC<{
	trigger: ApplicationTrigger
}> = ({ trigger }) => {
	const labelParts = trigger.label.trim().split('+')

	return (
		<div className="trigger-pill">
			{labelParts.map((part, index) => {
				const isKeyboard = trigger.fullIdentifiers[index]?.startsWith('keyboard')
				return (
					<React.Fragment key={index}>
						<div className={classNames('label-part', { keyboard: isKeyboard })}>
							<span className="label">
								{trigger.isGlobalKeyboard ? convertSorensenToElectron(part) : part}
							</span>
						</div>
						<span className="connect-labels">+</span>
					</React.Fragment>
				)
			})}
		</div>
	)
}
export const TriggerGlobalToggle: React.FC<{
	isGlobal: boolean
	onChange: () => void
}> = ({ isGlobal, onChange }) => {
	return (
		<ToggleButton
			title={
				isGlobal
					? 'This shortcut is global and will work even when SuperConductor is not in focus.\nGlobal shortcuts cannot differentiate between left and right modifier keys (Ctrl, Shift, etc), nor can they differentiate between NumpadEnter and regular Enter.\n\nWARNING: Global shortcuts will silently fail if another application has already registered this key combination.\n\nClick to make local.'
					: 'This shortcut is local and will only work when SuperConductor has focus.\n\nClick to make global.\n\nWARNING: Global shortcuts will silently fail if another application has already registered this key combination.'
			}
			value="isGlobalKeyboard"
			selected={isGlobal}
			size="small"
			onChange={() => {
				onChange()
			}}
		>
			<IoMdGlobe size={18} />
		</ToggleButton>
	)
}
