import { Button } from '@mui/material'
import _ from 'lodash'
import React, { useCallback, useContext, useEffect, useState, useRef } from 'react'
import { IoAddCircle, IoAddCircleOutline } from 'react-icons/io5'
import { RundownActionLight } from '../../../../../../lib/triggers/action.js'
import { PartGUI } from '../../../../../../models/rundown/Part.js'
import {
	ActiveTriggers,
	activeTriggersToString,
	ApplicationTrigger,
	RundownTrigger,
} from '../../../../../../models/rundown/Trigger.js'
import { ErrorHandlerContext } from '../../../../../contexts/ErrorHandler.js'
import { HotkeyContext } from '../../../../../contexts/Hotkey.js'
import { IPCServerContext } from '../../../../../contexts/IPCServer.js'
import { EditApplicationTrigger, EditRundownTrigger, NoEditTrigger } from '../../../../inputs/EditTrigger.js'

export const RundownTriggersSubmenu: React.FC<{
	rundownId: string
	groupId: string
	part: PartGUI
	locked?: boolean
	allActionsForPart: RundownActionLight[]
}> = ({ rundownId, groupId, part, locked, allActionsForPart }) => {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const hotkeyContext = useContext(HotkeyContext)

	const otherActions: RundownActionLight[] = allActionsForPart.filter(
		(action) => !part.triggers.find((t) => _.isEqual(t.fullIdentifiers, action.trigger.fullIdentifiers))
	)
	const actionCount = part.triggers.length + otherActions.length

	const onEditTrigger = useCallback(
		(index: number, trigger: RundownTrigger | null) => {
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
	const prevTriggers = useRef<ActiveTriggers>([])
	const handleTriggerBtn = useCallback(() => {
		setTriggerActive((oldActive) => !oldActive)
	}, [])
	const handleTrigger = useCallback(
		(triggers: ActiveTriggers) => {
			// was something pressed?
			const triggerLength = Object.keys(triggers).length
			if (triggerLength > prevTriggers.current.length) {
				// The length is longer; ie a button was pressed.
			} else if (triggerLength < prevTriggers.current.length) {
				// The length is shorter; ie a button was released.

				const trigger: RundownTrigger = {
					label: activeTriggersToString(prevTriggers.current),
					fullIdentifiers: prevTriggers.current.map((t) => t.fullIdentifier),
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

				// Stop listening for triggers:
				setTriggerActive(false)
			}
			prevTriggers.current = triggers
		},
		[handleError, ipcServer, groupId, part.id, rundownId]
	)
	useEffect(() => {
		if (triggerActive) {
			hotkeyContext.triggers.on('trigger', handleTrigger)
		} else {
			hotkeyContext.triggers.off('trigger', handleTrigger)
			prevTriggers.current = []
		}
		return () => {
			hotkeyContext.triggers.off('trigger', handleTrigger)
		}
	}, [hotkeyContext, triggerActive, handleTrigger])

	useEffect(() => {
		if (actionCount === 0 && !locked) {
			// There are no triggers, start listening for triggers right away:
			setTriggerActive(true)
		}
	}, [actionCount, locked])

	useEffect(() => {
		if (triggerActive && locked) setTriggerActive(false)
	}, [locked, triggerActive])

	return (
		<div className="part__triggers-submenu">
			{actionCount > 0 && (
				<div className="triggers">
					{part.triggers.map((trigger, index) => (
						<EditRundownTrigger
							key={index}
							trigger={trigger}
							index={index}
							onEdit={onEditTrigger}
							locked={locked}
						/>
					))}
					{otherActions.map((action, index) => (
						<NoEditTrigger key={index} trigger={action.trigger} label={action.area?.name} />
					))}
				</div>
			)}

			{actionCount > 0 && (
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
			)}

			<div>{triggerActive && `Click any button to assign it!`}</div>
		</div>
	)
}

export const ApplicationTriggersSubmenu: React.FC<{
	triggerAction: ApplicationTrigger['action']
	triggers: ApplicationTrigger[]
}> = ({ triggerAction, triggers }) => {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const hotkeyContext = useContext(HotkeyContext)

	const actionCount = triggers.length

	const onEditTrigger = useCallback(
		(index: number, trigger: ApplicationTrigger | null) => {
			ipcServer
				.setApplicationTrigger({
					triggerAction,
					trigger,
					triggerIndex: index,
				})
				.catch(handleError)
		},
		[handleError, ipcServer, triggerAction]
	)

	// Trigger button:
	const [triggerActive, setTriggerActive] = useState<boolean>(false)
	const prevTriggers = useRef<ActiveTriggers>([])
	const handleTriggerBtn = useCallback(() => {
		setTriggerActive((oldActive) => !oldActive)
	}, [])
	const handleTrigger = useCallback(
		(triggers: ActiveTriggers) => {
			// was something pressed?
			const triggerLength = Object.keys(triggers).length
			if (triggerLength > prevTriggers.current.length) {
				// The length is longer; ie a button was pressed.
			} else if (triggerLength < prevTriggers.current.length) {
				// The length is shorter; ie a button was released.

				const trigger: ApplicationTrigger = {
					label: activeTriggersToString(prevTriggers.current),
					fullIdentifiers: prevTriggers.current.map((t) => t.fullIdentifier),
					action: triggerAction,
				}

				ipcServer
					.setApplicationTrigger({
						triggerAction,
						trigger,
						triggerIndex: 9999, // Add a trigger
					})
					.catch(handleError)

				// Stop listening for triggers:
				setTriggerActive(false)
			}
			prevTriggers.current = triggers
		},
		[handleError, ipcServer, triggerAction]
	)
	useEffect(() => {
		if (triggerActive) {
			hotkeyContext.triggers.on('trigger', handleTrigger)
		} else {
			hotkeyContext.triggers.off('trigger', handleTrigger)
			prevTriggers.current = []
		}
		return () => {
			hotkeyContext.triggers.off('trigger', handleTrigger)
		}
	}, [hotkeyContext, triggerActive, handleTrigger])

	useEffect(() => {
		if (actionCount === 0) {
			// There are no triggers, start listening for triggers right away:
			setTriggerActive(true)
		}
	}, [actionCount])

	return (
		<div className="part__triggers-submenu">
			{actionCount > 0 && (
				<div className="triggers">
					{triggers.map((trigger, index) => (
						<EditApplicationTrigger key={index} trigger={trigger} index={index} onEdit={onEditTrigger} />
					))}
				</div>
			)}

			{actionCount > 0 && (
				<div className="controls">
					<Button variant="contained" size="small" title={'Assign Trigger'} onClick={handleTriggerBtn}>
						{triggerActive ? <IoAddCircle size={18} /> : <IoAddCircleOutline size={18} />}
					</Button>
				</div>
			)}

			<div>{triggerActive && `Click any button to assign it!`}</div>
		</div>
	)
}
