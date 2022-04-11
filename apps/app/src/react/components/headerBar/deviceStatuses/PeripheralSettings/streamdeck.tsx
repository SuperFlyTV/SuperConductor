import React, { useCallback, useContext, useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import classNames from 'classnames'
import { Button } from '@mui/material'
import { KeyDisplay, KeyDisplayTimeline, PeripheralInfo_StreamDeck, AttentionLevel } from '@shared/api'
import { compact } from '@shared/lib'
import { ActiveTriggers } from '../../../../../models/rundown/Trigger'
import { Peripheral } from '../../../../../models/project/Peripheral'
import { Rundown } from '../../../../../models/rundown/Rundown'
import { HotkeyContext } from '../../../../contexts/Hotkey'
import { store } from '../../../../mobx/store'
import { useMemoComputedObject } from '../../../../mobx/lib'
import { Action, getAllActionsInRundowns } from '../../../../../lib/triggers/action'
import { getKeyDisplayForButtonActions } from '../../../../../lib/triggers/keyDisplay'
import { TimelineDisplay } from './TimelineDisplay'

export const StreamdeckSettings: React.FC<{
	peripheralId: string
	peripheral: Peripheral
}> = observer(function StreamdeckSettings({ peripheralId, peripheral }) {
	const hotkeyContext = useContext(HotkeyContext)
	// const ipcServer = useContext(IPCServerContext)
	if (peripheral.info.gui.type !== 'streamdeck') throw new Error('Wrong type, expected "streamdeck"')
	const gui: PeripheralInfo_StreamDeck = peripheral.info.gui

	const allButtonActions = useMemoComputedObject(() => {
		const newButtonActions = new Map<string, Action[]>()
		const rundowns: Rundown[] = compact(
			Object.keys(store.rundownsStore.rundowns ?? []).map((rundownId) =>
				store.rundownsStore.getRundown(rundownId)
			)
		)
		const allActions = getAllActionsInRundowns(rundowns)
		for (const action of allActions) {
			for (const fullIdentifier of action.trigger.fullIdentifiers) {
				let newButtonAction = newButtonActions.get(fullIdentifier)
				if (!newButtonAction) {
					newButtonAction = []
					newButtonActions.set(fullIdentifier, newButtonAction)
				}
				newButtonAction.push(action)
			}
		}
		return newButtonActions
	}, [store.rundownsStore.rundowns])

	const [pressedKeys, setPressedKeys] = useState<{ [fullIdentifier: string]: true }>({})
	const handleTrigger = useCallback(
		(triggers: ActiveTriggers) => {
			const newPressedKeys: { [fullIdentifier: string]: true } = {}
			for (const trigger of triggers) {
				if (`${trigger.bridgeId}-${trigger.deviceId}` === peripheralId) {
					newPressedKeys[trigger.fullIdentifier] = true
				}
			}
			setPressedKeys(newPressedKeys)
		},
		[peripheralId]
	)

	useEffect(() => {
		hotkeyContext.triggers.on('trigger', handleTrigger)
		return () => {
			hotkeyContext.triggers.off('trigger', handleTrigger)
		}
	})

	const buttons: {
		fullIdentifier: string
		label: string
		iCol: number
		iRow: number
		actions: Action[]
		keyDisplay: KeyDisplay | KeyDisplayTimeline
	}[] = []
	let iKey = -1
	for (let iRow = 0; iRow < gui.layout.height; iRow++) {
		for (let iCol = 0; iCol < gui.layout.width; iCol++) {
			iKey++

			const fullIdentifier = `${peripheralId}-${iKey}`
			const buttonActions = allButtonActions.get(fullIdentifier) ?? []

			buttons.push({
				fullIdentifier,
				label: `${iKey}`,
				iCol,
				iRow,
				actions: buttonActions,
				keyDisplay: getKeyDisplayForButtonActions(buttonActions),
			})
		}
	}

	return (
		<div className="streamdeck">
			<div className="button-grid">
				{buttons.map((button) => {
					return (
						<div
							key={button.fullIdentifier}
							className={classNames('button', {
								pressed: pressedKeys[button.fullIdentifier] ?? false,
							})}
							style={{
								gridColumn: button.iCol + 1,
								gridRow: button.iRow + 1,
							}}
						>
							<div className="key-label">{button.label}</div>
							<div className="key-display">
								<TimelineDisplay
									keyDisplayTimeline={button.keyDisplay}
									render={renderStreamDeckKeyDisplay}
								/>
							</div>
						</div>
					)
				})}
			</div>

			{/* <div>
				<Button className="btn" variant="contained" onClick={() => createNewArea()}>
					Create new button Area
				</Button>
			</div> */}
		</div>
	)
})

function renderStreamDeckKeyDisplay(keyDisplay: KeyDisplay): JSX.Element {
	let borderWidth = 0
	let borderColor = '#000'

	if (keyDisplay.attentionLevel === AttentionLevel.IGNORE) {
		borderWidth = 0
		borderColor = '#000'
	} else if (keyDisplay.attentionLevel === AttentionLevel.NEUTRAL) {
		borderWidth = 2
		borderColor = '#333'
	} else if (keyDisplay.attentionLevel === AttentionLevel.INFO) {
		borderWidth = 2
		borderColor = '#bbb'
	} else if (keyDisplay.attentionLevel === AttentionLevel.NOTIFY) {
		borderColor = '#ff0'
		borderWidth = 3
	} else if (keyDisplay.attentionLevel === AttentionLevel.ALERT) {
		borderWidth = 7
		borderColor = '#f00'
	}

	return (
		<>
			<div
				className="key-bg"
				style={{
					border: `${borderWidth}px solid ${borderColor}`,
				}}
			></div>
			{keyDisplay.header?.short ? (
				<div className="single-line">{keyDisplay.header.short}</div>
			) : (
				<div className="multi-line">{keyDisplay.header?.long}</div>
			)}

			{keyDisplay.info?.short ? (
				<div className="single-line">{keyDisplay.info.short}</div>
			) : (
				<div className="multi-line">{keyDisplay.info?.long}</div>
			)}
		</>
	)
}
