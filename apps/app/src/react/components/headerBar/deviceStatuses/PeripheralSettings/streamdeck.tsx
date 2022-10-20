import React, { useCallback, useContext, useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import classNames from 'classnames'
import { KeyDisplay, KeyDisplayTimeline, PeripheralInfo_StreamDeck, AttentionLevel } from '@shared/api'
import { stringToRGB, RGBToString, assertNever, getPeripheralId } from '@shared/lib'
import { ActiveTrigger, ActiveTriggers } from '../../../../../models/rundown/Trigger'
import { PeripheralStatus } from '../../../../../models/project/Peripheral'
import { HotkeyContext } from '../../../../contexts/Hotkey'
import { store } from '../../../../mobx/store'
import { useMemoComputedObject } from '../../../../mobx/lib'
import { ActionAny } from '../../../../../lib/triggers/action'
import {
	DefiningArea,
	getKeyDisplayForButtonActions,
	prepareTriggersAreaMap,
} from '../../../../../lib/triggers/keyDisplay/keyDisplay'
import { TimelineDisplay } from './TimelineDisplay'

export const StreamdeckSettings: React.FC<{
	bridgeId: string
	deviceId: string
	peripheral: PeripheralStatus
	definingArea: DefiningArea | null
}> = observer(function StreamdeckSettings({ bridgeId, deviceId, peripheral, definingArea }) {
	const hotkeyContext = useContext(HotkeyContext)
	if (peripheral.info.gui.type !== 'streamdeck') throw new Error('Wrong type, expected "streamdeck"')
	const gui: PeripheralInfo_StreamDeck = peripheral.info.gui
	const project = store.projectStore.project

	const peripheralId = getPeripheralId(bridgeId, deviceId)

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
		actions: ActionAny[]
		keyDisplay: KeyDisplay | KeyDisplayTimeline
	}[] = []
	let iKey = -1
	for (let iRow = 0; iRow < gui.layout.height; iRow++) {
		for (let iCol = 0; iCol < gui.layout.width; iCol++) {
			iKey++

			const identifier = `${iKey}`
			const fullIdentifier = `${peripheralId}-${identifier}`
			const deviceId = peripheralId.replace(`${bridgeId}-`, '')
			const buttonActions = store.rundownsStore.allButtonActions.get(fullIdentifier) ?? []

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
		</div>
	)
})

function renderStreamDeckKeyDisplay(keyDisplay: KeyDisplay): JSX.Element {
	if (keyDisplay.intercept) {
		if (keyDisplay.area) {
			let textColor: string
			if (keyDisplay.area.areaInDefinition) {
				textColor = '#fff'
			} else {
				textColor = '#bbb'
			}
			// Area label:
			return (
				<>
					<div
						className="key-bg"
						style={{
							backgroundColor: keyDisplay.area.color,
						}}
					/>
					<div
						className="single-line"
						style={{
							color: textColor,
						}}
					>
						{keyDisplay.area.areaLabel}
					</div>
					<div
						className="large-center"
						style={{
							color: textColor,
						}}
					>
						{keyDisplay.area.keyLabel}
					</div>
				</>
			)
		} else {
			return <></>
		}
	} else {
		let borderWidth = 0
		let borderColor = '#000'
		let bgColor = ''

		const dampen = keyDisplay.attentionLevel === AttentionLevel.IGNORE

		if (keyDisplay.area) {
			// Darken the color:
			const rgb = stringToRGB(keyDisplay.area.color)
			bgColor = RGBToString({
				r: rgb.r * 0.5,
				g: rgb.g * 0.5,
				b: rgb.b * 0.5,
			})
		}

		if (keyDisplay.attentionLevel === AttentionLevel.IGNORE) {
			// No border
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
			bgColor = '#ff3'
		} else {
			assertNever(keyDisplay.attentionLevel)
		}

		// Calculate background brightness:
		const averageBackgroundColor = stringToRGB(bgColor)
		/** 0 - 255 */
		const brightness =
			(averageBackgroundColor.r * 299 + averageBackgroundColor.g * 587 + averageBackgroundColor.b * 114) / 1000
		const backgroundIsDark = brightness < 127

		let textColor: string
		if (backgroundIsDark) {
			textColor = dampen ? '#999' : '#fff'
		} else {
			textColor = dampen ? '#333' : '#000'
		}

		return (
			<div
				style={{
					color: textColor,
				}}
			>
				<div
					className="key-bg"
					style={{
						border: `${borderWidth}px solid ${borderColor}`,
						backgroundColor: bgColor,
					}}
				></div>
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

				{keyDisplay.info?.short ? (
					<div className="single-line">{keyDisplay.info.short}</div>
				) : (
					<div className="multi-line">{keyDisplay.info?.long}</div>
				)}
			</div>
		)
	}
}
