import { Button, ButtonGroup, ToggleButton } from '@mui/material'

import React, { useMemo } from 'react'

import { ApplicationTrigger, RundownTrigger } from '../../../models/rundown/Trigger'
import { MdPlayArrow, MdStop } from 'react-icons/md'
import { BsTrash } from 'react-icons/bs'
import { IoMdGlobe } from 'react-icons/io'
import classNames from 'classnames'
import { observer } from 'mobx-react-lite'
import { store } from '../../mobx/store'
import { useMemoComputedObject } from '../../mobx/lib'
import { assertNever } from '@shared/lib'
import { convertSorensenToElectron, identifierIsKeyboard, triggerIsKeyboard } from '../../../lib/triggers/identifiers'

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
}> = observer(function EditRundownTrigger({ trigger, index, onEdit, locked }) {
	const isKeyboard = triggerIsKeyboard(trigger)
	const failedGlobalShortcuts = useMemoComputedObject(() => {
		return store.triggersStore.failedGlobalTriggers
	}, [store.triggersStore.failedGlobalTriggers])
	const electronAccelerator = useMemo(() => {
		return trigger.fullIdentifiers.map(convertSorensenToElectron).join('+')
	}, [trigger.fullIdentifiers])

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
			{isKeyboard && (
				<div className="field">
					<TriggerGlobalToggle
						isGlobal={trigger.isGlobalKeyboard}
						failedToRegister={failedGlobalShortcuts.has(electronAccelerator)}
						onChange={() => {
							onEdit(index, {
								...trigger,
								isGlobalKeyboard: !trigger.isGlobalKeyboard,
							})
						}}
					/>
				</div>
			)}
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
})

export const EditApplicationTrigger: React.FC<{
	trigger: ApplicationTrigger
	index: number
	onEdit?: (index: number, trigger: ApplicationTrigger | null) => void
}> = observer(function EditApplicationTrigger({ trigger, index, onEdit }) {
	const isKeyboard = triggerIsKeyboard(trigger)
	const failedGlobalShortcuts = useMemoComputedObject(() => {
		return store.triggersStore.failedGlobalTriggers
	}, [store.triggersStore.failedGlobalTriggers])
	const electronAccelerator = useMemo(() => {
		return trigger.fullIdentifiers.map(convertSorensenToElectron).join('+')
	}, [trigger.fullIdentifiers])

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

					{isKeyboard && (
						<div className="field">
							<TriggerGlobalToggle
								isGlobal={trigger.isGlobalKeyboard}
								failedToRegister={failedGlobalShortcuts.has(electronAccelerator)}
								onChange={() => {
									onEdit(index, {
										...trigger,
										isGlobalKeyboard: !trigger.isGlobalKeyboard,
									})
								}}
							/>
						</div>
					)}
				</>
			)}

			<TriggerPill trigger={trigger} />
		</div>
	)
})
export const TriggerPill: React.FC<{
	trigger: ApplicationTrigger
}> = ({ trigger }) => {
	const labelParts = trigger.label.trim().split('+')

	return (
		<div className="trigger-pill">
			{labelParts.map((part, index) => {
				const isKeyboard = identifierIsKeyboard(trigger.fullIdentifiers[index])
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
	failedToRegister: boolean
	onChange: () => void
}> = ({ isGlobal, failedToRegister, onChange }) => {
	let title = isGlobal
		? 'This trigger is global and will work even when SuperConductor is not in focus.\nGlobal triggers cannot differentiate between left and right modifier keys (Ctrl, Shift, etc), nor can they differentiate between NumpadEnter and regular Enter.\n\nThis global trigger has successfully registered.\n\nClick to make local.'
		: 'This trigger is local and will only work when SuperConductor has focus.\n\nClick to make global.\n\nWARNING: Global triggers may fail to register if another application has already registered this key combination. Failed global triggers will have their globe icon turn red.'

	if (isGlobal && failedToRegister) {
		title =
			'WARNING: This global trigger failed to register and will not work! This is likely because another application has already registered the same hotkey.\n\nClick to make local. Click again to try re-registering the global trigger.'
	}

	return (
		<ToggleButton
			title={title}
			value="isGlobalKeyboard"
			selected={isGlobal}
			size="small"
			sx={{ position: 'relative' }}
			onChange={() => {
				onChange()
			}}
		>
			<IoMdGlobe size={18} color={failedToRegister ? 'red' : 'white'} />
		</ToggleButton>
	)
}
