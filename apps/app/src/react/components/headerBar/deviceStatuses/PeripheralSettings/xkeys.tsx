import React, { useCallback, useContext, useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import classNames from 'classnames'
import { KeyDisplay, KeyDisplayTimeline, AttentionLevel, PeripheralInfo_XKeys } from '@shared/api'
import { compact } from '@shared/lib'
import { ActiveTrigger, ActiveTriggers } from '../../../../../models/rundown/Trigger'
import { PeripheralStatus } from '../../../../../models/project/Peripheral'
import { Rundown } from '../../../../../models/rundown/Rundown'
import { HotkeyContext } from '../../../../contexts/Hotkey'
import { store } from '../../../../mobx/store'
import { useMemoComputedObject } from '../../../../mobx/lib'
import { Action, getAllActionsInRundowns } from '../../../../../lib/triggers/action'
import {
	DefiningArea,
	getKeyDisplayForButtonActions,
	prepareTriggersAreaMap,
} from '../../../../../lib/triggers/keyDisplay'
import { TimelineDisplay } from './TimelineDisplay'

export const XKeysSettings: React.FC<{
	bridgeId: string
	deviceId: string
	peripheral: PeripheralStatus
	definingArea: DefiningArea | null
}> = observer(function XKeysSettings({ bridgeId, deviceId, peripheral, definingArea }) {
	const hotkeyContext = useContext(HotkeyContext)
	if (peripheral.info.gui.type !== 'xkeys') throw new Error('Wrong type, expected "xkeys"')
	const gui: PeripheralInfo_XKeys = peripheral.info.gui
	const project = store.projectStore.project

	const peripheralId = `${bridgeId}-${deviceId}`

	const allButtonActions = useMemoComputedObject(() => {
		const newButtonActions = new Map<string, Action[]>()
		const rundowns: Rundown[] = compact(
			Object.keys(store.rundownsStore.rundowns ?? []).map((rundownId) =>
				store.rundownsStore.getRundown(rundownId)
			)
		)
		const allActions = getAllActionsInRundowns(rundowns, project)
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
	}, [store.rundownsStore.rundowns, project])

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

	const triggersAreaMap = useMemoComputedObject(() => {
		return prepareTriggersAreaMap(project)
	}, [project])

	const buttons: {
		fullIdentifier: string
		label: string
		iCol: number
		iRow: number
		actions: Action[]
		keyDisplay: KeyDisplay | KeyDisplayTimeline
	}[] = []

	const ignorePositions = new Set<string>()

	for (const xKeysLayout of gui.layout) {
		// This is kind of a hack since the xeys library doesn't expose the data we need,
		// so instead we hide any buttons in these layouts:
		const ignorePosition = Boolean(xKeysLayout.name.match(/jog|tbar|shuttle|joy/i))

		let iKey = 1 // First key starts at 1
		for (let iCol = xKeysLayout.startCol; iCol <= xKeysLayout.endCol; iCol++) {
			for (let iRow = xKeysLayout.startRow; iRow <= xKeysLayout.endRow; iRow++) {
				const identifier = `${iKey}`
				const fullIdentifier = `${peripheralId}-${identifier}`
				const deviceId = peripheralId.replace(`${bridgeId}-`, '')
				const buttonActions = allButtonActions.get(fullIdentifier) ?? []

				if (ignorePosition) ignorePositions.add(`${iRow}-${iCol}`)

				const trigger: ActiveTrigger = {
					fullIdentifier,
					bridgeId,
					deviceId,
					deviceName: '',
					identifier,
				}

				const keyDisplay = getKeyDisplayForButtonActions(
					trigger,
					triggersAreaMap,
					definingArea,

					buttonActions
				)

				buttons.push({
					fullIdentifier,
					label: `${iKey}`,
					iCol,
					iRow,
					actions: buttonActions,
					keyDisplay,
				})

				iKey++
			}
		}
	}
	const usedIdentifiers = new Set<string>()
	return (
		<div className="xkeys">
			<div className="button-grid">
				{buttons.map((button) => {
					if (ignorePositions.has(`${button.iRow}-${button.iCol}`)) return null
					if (usedIdentifiers.has(button.fullIdentifier)) usedIdentifiers.add(button.fullIdentifier)
					return (
						<div
							key={button.fullIdentifier}
							className={classNames('button', {
								pressed: pressedKeys[button.fullIdentifier] ?? false,
							})}
							style={{
								gridColumn: button.iCol,
								gridRow: button.iRow,
							}}
						>
							<div className="key-label">{button.label}</div>
							<div className="key-display">
								<TimelineDisplay
									keyDisplayTimeline={button.keyDisplay}
									render={renderXkeysKeyDisplay}
								/>
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
})

const FLASH_NORMAL = 1
const FLASH_FAST = 2

function renderXkeysKeyDisplay(keyDisplay: KeyDisplay): JSX.Element {
	let color: 'black' | 'blue' | 'red' | 'white' = 'black'
	/** 0 = no flash, 1 = slow flash, 2 = fast flash  */
	let flashFrequency: 0 | 1 | 2 = 0

	if (keyDisplay.intercept) {
		// Normal functionality is intercepted / disabled

		if (keyDisplay.area) {
			if (keyDisplay.area.areaInDefinition) {
				color = 'red'
			} else {
				color = 'blue'
			}
		} else {
			color = 'black'
		}
	} else {
		if (keyDisplay.attentionLevel === AttentionLevel.NEUTRAL) {
			color = 'blue'
			flashFrequency = 0
		} else if (keyDisplay.attentionLevel === AttentionLevel.INFO) {
			color = 'red'
			flashFrequency = 0
		} else if (keyDisplay.attentionLevel === AttentionLevel.NOTIFY) {
			color = 'red' // flashing slowly
			flashFrequency = FLASH_NORMAL
		} else if (keyDisplay.attentionLevel === AttentionLevel.ALERT) {
			color = 'white' // flashing quickly
			flashFrequency = FLASH_FAST
		}
	}

	let rgbColor: string
	switch (color) {
		case 'blue':
			rgbColor = '#00f'
			break
		case 'red':
			rgbColor = '#f00'
			break
		case 'white':
			rgbColor = '#fff'
			break
		case 'black':
		default:
			rgbColor = 'transparent'
	}
	return (
		<>
			<div
				className={classNames('key-bg', `flash-speed-${flashFrequency}`)}
				style={{
					backgroundColor: rgbColor,
				}}
			/>
			{keyDisplay.intercept ? (
				<>
					{keyDisplay.area && <div className="single-line">{keyDisplay.area.areaLabel}</div>}
					{keyDisplay.area && <div className="large-center">{keyDisplay.area.keyLabel}</div>}
				</>
			) : (
				<>
					{keyDisplay.area && (
						<div className="area-label">
							{keyDisplay.area.areaLabel}, {keyDisplay.area.keyLabel}
						</div>
					)}

					{keyDisplay.header?.short ? (
						<div className="single-line">{keyDisplay.header.short}</div>
					) : (
						<div className="multi-line">{keyDisplay.header?.long}</div>
					)}
				</>
			)}
		</>
	)
}
