import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Part } from '../../../../models/rundown/Part'
import { ActiveTriggers, Trigger, activeTriggersToString } from '../../../../models/rundown/Trigger'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler'
import { HotkeyContext } from '../../../contexts/Hotkey'
import { IPCServerContext } from '../../../contexts/IPCServer'
import { EditTrigger } from '../../inputs/EditTrigger'
import { TrashBtn } from '../../inputs/TrashBtn'
import { TriggerBtn } from '../../inputs/TriggerBtn'
import { ConfirmationDialog } from '../../util/ConfirmationDialog'

interface IPartSubmenuProps {
	rundownId: string
	groupId: string
	part: Part
	locked?: boolean
}

export const PartSubmenu: React.FC<IPartSubmenuProps> = ({ rundownId, groupId, part, locked }) => {
	const ipcServer = useContext(IPCServerContext)
	const hotkeyContext = useContext(HotkeyContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
	const [triggerActive, setTriggerActive] = useState<boolean>(false)
	const prevTriggerLength = useRef(0)
	const handleTrigger = useCallback(
		(triggers: ActiveTriggers) => {
			// was something pressed?
			const triggerLength = Object.keys(triggers).length
			if (triggerLength > prevTriggerLength.current) {
				// The length is longer; ie a button was pressed.

				const trigger: Trigger = {
					label: activeTriggersToString(triggers),
					fullIdentifiers: triggers.map((t) => t.fullIdentifier),
					action: 'play',
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
	const handleTriggerBtn = useCallback(() => {
		setTriggerActive((oldActive) => !oldActive)
	}, [])

	const handleDelete = useCallback(() => {
		ipcServer.deletePart({ rundownId, groupId, partId: part.id }).catch(handleError)
	}, [groupId, handleError, ipcServer, part.id, rundownId])

	return (
		<div className="part__submenu">
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
				<TriggerBtn
					disabled={locked}
					onTrigger={handleTriggerBtn}
					active={triggerActive}
					title={'Assign Trigger' + (locked ? ' (disabled due to locked Part or Group)' : '')}
				/>

				<TrashBtn
					disabled={locked}
					title={'Delete Part' + (locked ? ' (disabled due to locked Part or Group)' : '')}
					onClick={() => {
						const pressedKeys = hotkeyContext.sorensen.getPressedKeys()
						if (pressedKeys.includes('ControlLeft') || pressedKeys.includes('ControlRight')) {
							// Delete immediately with no confirmation dialog.
							handleDelete()
						} else {
							setDeleteConfirmationOpen(true)
						}
					}}
				/>
			</div>

			<ConfirmationDialog
				open={deleteConfirmationOpen}
				title="Delete Part"
				body={`Are you sure you want to delete the part "${part.name}"?`}
				acceptLabel="Delete"
				onAccepted={() => {
					handleDelete()
					setDeleteConfirmationOpen(false)
				}}
				onDiscarded={() => {
					setDeleteConfirmationOpen(false)
				}}
			/>
		</div>
	)
}
