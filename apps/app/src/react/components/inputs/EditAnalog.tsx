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
import { ActiveAnalog } from '../../../models/rundown/Analog'

const ACTION_ICON_SIZE = 12

// export const EditAnalog: React.FC<{
// 	trigger: ApplicationTrigger
// 	index: number
// 	onEdit?: (index: number, trigger: ApplicationTrigger | null) => void
// }> = observer(function EditApplicationTrigger({ trigger, index, onEdit }) {
// 	const isKeyboard = triggerIsKeyboard(trigger)
// 	const failedGlobalShortcuts = useMemoComputedObject(() => {
// 		return store.triggersStore.failedGlobalTriggers
// 	}, [store.triggersStore.failedGlobalTriggers])
// 	const electronAccelerator = useMemo(() => {
// 		return trigger.fullIdentifiers.map(convertSorensenToElectron).filter(Boolean).join('+')
// 	}, [trigger.fullIdentifiers])

// 	return (
// 		<div className={classNames('trigger')}>
// 			{onEdit && (
// 				<>
// 					<div className="field">
// 						<Button
// 							variant="contained"
// 							onClick={() => {
// 								onEdit(index, null)
// 							}}
// 							color="error"
// 							title="Delete Trigger"
// 							size="small"
// 						>
// 							<BsTrash size={ACTION_ICON_SIZE} />
// 						</Button>
// 					</div>

// 					{isKeyboard && (
// 						<div className="field">
// 							<TriggerGlobalToggle
// 								isGlobal={trigger.isGlobalKeyboard}
// 								failedToRegister={failedGlobalShortcuts.has(electronAccelerator)}
// 								onChange={() => {
// 									onEdit(index, {
// 										...trigger,
// 										isGlobalKeyboard: !trigger.isGlobalKeyboard,
// 									})
// 								}}
// 							/>
// 						</div>
// 					)}
// 				</>
// 			)}

// 			<TriggerPill trigger={trigger} />
// 		</div>
// 	)
// })
export const AnalogPill: React.FC<{
	analog: ActiveAnalog
}> = ({ analog }) => {
	return <>{analog.identifier}</>
	// const labelParts = trigger.label.trim().split('+')

	// return (
	// 	<div className="analog-pill">
	// 		{labelParts.map((labelPart, index) => {
	// 			const fullIdentifier = trigger.fullIdentifiers[index] as string | undefined
	// 			const isKeyboard = fullIdentifier ? identifierIsKeyboard(fullIdentifier) : false
	// 			return (
	// 				<React.Fragment key={index}>
	// 					<div className={classNames('label-part', { keyboard: isKeyboard })}>
	// 						<span className="label">
	// 							{trigger.isGlobalKeyboard
	// 								? convertSorensenToElectron(fullIdentifier ?? labelPart) ??
	// 								  `UNSUPPORTED: ${fullIdentifier ?? labelPart}`
	// 								: labelPart}
	// 						</span>
	// 					</div>
	// 					<span className="connect-labels">+</span>
	// 				</React.Fragment>
	// 			)
	// 		})}
	// 	</div>
	// )
}
export const TriggerGlobalToggle: React.FC<{
	isGlobal: boolean | undefined
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
