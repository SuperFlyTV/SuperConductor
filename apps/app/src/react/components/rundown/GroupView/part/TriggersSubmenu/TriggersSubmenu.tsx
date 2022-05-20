import { Button } from '@mui/material'
import React, { useCallback, useContext, useEffect, useState, useRef } from 'react'
import { IoAddCircle, IoAddCircleOutline } from 'react-icons/io5'
import { Part } from '../../../../../../models/rundown/Part'
import { ActiveTriggers, activeTriggersToString, Trigger } from '../../../../../../models/rundown/Trigger'
import { ErrorHandlerContext } from '../../../../../contexts/ErrorHandler'
import { HotkeyContext } from '../../../../../contexts/Hotkey'
import { IPCServerContext } from '../../../../../contexts/IPCServer'
import { EditTrigger } from '../../../../inputs/EditTrigger'

interface ITriggersSubmenuProps {
	rundownId: string
	groupId: string
	part: Part
	locked?: boolean
}

export const TriggersSubmenu: React.FC<ITriggersSubmenuProps> = ({ rundownId, groupId, part, locked }) => {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const hotkeyContext = useContext(HotkeyContext)

	const onEditTrigger = useCallback(
		(index: number, trigger: Trigger | null) => {
			ipcServer
				.setPartTrigger({
					rundownId,
					groupId,
					partId: part.id,
					trigger,
					triggerIndex: index,
				})
				.catch(handleError)
		},
		[groupId, handleError, ipcServer, part.id, rundownId]
	)

	// Trigger button:
	const [triggerActive, setTriggerActive] = useState<boolean>(false)
	const prevTriggerLength = useRef(0)
	const handleTriggerBtn = useCallback(() => {
		setTriggerActive((oldActive) => !oldActive)
	}, [])
	const handleTrigger = useCallback(
		(triggers: ActiveTriggers) => {
			// was something pressed?
			const triggerLength = Object.keys(triggers).length
			if (triggerLength > prevTriggerLength.current) {
				// The length is longer; ie a button was pressed.

				const trigger: Trigger = {
					label: activeTriggersToString(triggers),
					fullIdentifiers: triggers.map((t) => t.fullIdentifier),
					action: 'playStop',
				}

				ipcServer
					.setPartTrigger({
						rundownId,
						groupId,
						partId: part.id,
						trigger,
						triggerIndex: 9999, // Add a trigger
					})
					.catch(handleError)
			} else if (triggerLength < prevTriggerLength.current) {
				// The length is shorter; ie a button was released.
				// Stop listening for triggers:
				setTriggerActive(false)
			}
			prevTriggerLength.current = triggerLength
		},
		[handleError, ipcServer, groupId, part.id, rundownId]
	)
	useEffect(() => {
		if (triggerActive) {
			hotkeyContext.triggers.on('trigger', handleTrigger)
		} else {
			hotkeyContext.triggers.off('trigger', handleTrigger)
			prevTriggerLength.current = 0
		}
		return () => {
			hotkeyContext.triggers.off('trigger', handleTrigger)
		}
	}, [hotkeyContext, triggerActive, handleTrigger])

	return (
		<div className="part__triggers-submenu">
			{part.triggers.length > 0 && (
				<div className="triggers">
					{part.triggers.map((trigger, index) => (
						<EditTrigger
							key={index}
							trigger={trigger}
							index={index}
							onEdit={onEditTrigger}
							locked={locked}
						/>
					))}
				</div>
			)}

			<div className="controls">
				<Button
					variant="contained"
					size="small"
					title={'Assign Trigger' + (locked ? ' (disabled due to locked Part or Group)' : '')}
					disabled={locked}
					onClick={handleTriggerBtn}
				>
					{triggerActive ? <IoAddCircle size={18} /> : <IoAddCircleOutline size={18} />}
				</Button>
			</div>
		</div>
	)
}
