import React from 'react'
import _ from 'lodash'
import { assertNever, deepClone } from '@shared/lib'
import {
	ChannelFormat,
	Direction,
	Ease,
	TimelineContentTypeCasparCg,
	TimelineObjCasparCGAny,
	TimelineObjCCGHTMLPage,
	TimelineObjCCGInput,
	TimelineObjCCGIP,
	TimelineObjCCGMedia,
	TimelineObjCCGProducerContentBase,
	TimelineObjCCGRecord,
	TimelineObjCCGRoute,
	TimelineObjCCGTemplate,
	TimelineTransition,
	Transition,
	TSRTimelineObj,
	TSRTimelineObjBase,
	TSRTransitionOptions,
} from 'timeline-state-resolver-types'
import { EditWrapper, OnSave } from './lib'
import { BooleanInput } from '../../../inputs/BooleanInput'
import { DurationInput } from '../../../inputs/DurationInput'
import { SelectEnum } from '../../../inputs/SelectEnum'
import { IntInput } from '../../../inputs/IntInput'
import { TextInput } from '../../../inputs/TextInput'
import { Link } from '@mui/material'
import { Btn } from '../../../inputs/Btn/Btn'
import { TrashBtn } from '../../../inputs/TrashBtn'
import { AddBtn } from '../../../inputs/AddBtn'

import './casparcg.scss'
import { FloatInput } from '../../../inputs/FloatInput'
import { TextBtn } from '../../../inputs/textBtn/TextBtn'
import { store } from '../../../../mobx/store'
import { useMemoComputedObject } from '../../../../mobx/lib'
import { AnalogInputOverridePicker } from '../../../inputs/AnalogInputPicker/AnalogInputPicker'

export const EditTimelineObjCasparCGAny: React.FC<{ obj: TimelineObjCasparCGAny; onSave: OnSave }> = ({
	obj,
	onSave,
}) => {
	let settings: JSX.Element = <></>

	const [showAll, setShowAll] = React.useState(false)
	// const [showMixer, setShowMixer] = React.useState(false)

	const commonSettings: JSX.Element = (
		<>
			<div className="setting">
				<SelectEnum
					label="Type"
					fullWidth
					currentValue={obj.content.type}
					options={TimelineContentTypeCasparCg}
					onChange={(newValue) => {
						obj.content.type = newValue
						onSave(obj)
					}}
				/>
			</div>
		</>
	)

	// TODO: base properties:
	// transitions?: {
	//     inTransition?: TimelineTransition;
	//     outTransition?: TimelineTransition;
	// };
	// mixer?: Mixer;

	const getSettingsChannelLayout = (obj: TimelineObjCasparCGAny & { content: { channelLayout?: string } }) => (
		<>
			{showAll || obj.content.channelLayout !== undefined ? (
				<div className="setting">
					<TextInput
						label="channelLayout"
						fullWidth
						currentValue={obj.content.channelLayout}
						onChange={(v) => {
							obj.content.channelLayout = v
							onSave(obj)
						}}
						allowUndefined={true}
					/>
				</div>
			) : null}
		</>
	)

	const getSettingsVideoAudioFilters = (
		obj: TimelineObjCasparCGAny & { content: { videoFilter?: string; audioFilter?: string } }
	) => (
		<>
			{showAll || obj.content.videoFilter ? (
				<div className="setting">
					<TextInput
						label="VideoFilter"
						fullWidth
						currentValue={obj.content.videoFilter}
						onChange={(v) => {
							obj.content.videoFilter = v
							onSave(obj)
						}}
						allowUndefined={true}
					/>
				</div>
			) : null}
			{showAll || obj.content.audioFilter ? (
				<div className="setting">
					<TextInput
						label="AudioFilter"
						fullWidth
						currentValue={obj.content.audioFilter}
						onChange={(v) => {
							obj.content.audioFilter = v
							onSave(obj)
						}}
						allowUndefined={true}
					/>
				</div>
			) : null}
		</>
	)

	const getSettingsTransitions = (obj: TimelineObjCasparCGAny & { content: TimelineObjCCGProducerContentBase }) => {
		if (!obj.content.transitions) obj.content.transitions = {}
		if (!obj.content.transitions.inTransition) obj.content.transitions.inTransition = { type: Transition.CUT }
		if (!obj.content.transitions.outTransition) obj.content.transitions.outTransition = { type: Transition.CUT }

		return (
			<>
				<div className="setting-separator"></div>
				{getSettingsTransitionInner(obj, obj.content.transitions.inTransition, 'In')}
				<div className="setting-separator"></div>
				{getSettingsTransitionInner(obj, obj.content.transitions.outTransition, 'Out')}
			</>
		)
	}
	const getSettingsTransitionInner = (obj: TimelineObjCasparCGAny, transition: TimelineTransition, label: string) => {
		const el: JSX.Element[] = []

		if (showAll || (transition.type ?? Transition.CUT) !== Transition.CUT) {
			el.push(
				<div className="setting" key="type">
					<SelectEnum
						label={`${label} Transition`}
						fullWidth
						currentValue={transition?.type}
						options={Transition}
						defaultValue={Transition.CUT}
						onChange={(v) => {
							transition.type = v
							// Convenience: add default values:
							if (transition.type === Transition.CUT) {
								transition.duration = undefined
							} else if (transition.type === Transition.MIX) {
								if (!transition.duration) transition.duration = 500
							} else if (
								transition.type === Transition.PUSH ||
								transition.type === Transition.SLIDE ||
								transition.type === Transition.WIPE
							) {
								if (!transition.duration) transition.duration = 500
								if (transition.easing === undefined) transition.easing = Ease.IN_OUT_CUBIC
							}
							onSave(obj)
						}}
					/>
				</div>
			)
		}

		const mixSettings: JSX.Element[] = []

		if (transition.type !== Transition.STING && transition.type !== Transition.TSR_TRANSITION) {
			if (showAll || transition.duration !== undefined) {
				mixSettings.push(
					<div className="setting" key="duration">
						<DurationInput
							label="Mix Duration"
							fullWidth
							currentValue={transition.duration}
							onChange={(v) => {
								transition.duration = v
								onSave(obj)
							}}
							allowUndefined={true}
						/>
					</div>
				)
			}
			if (showAll || transition.easing !== undefined) {
				mixSettings.push(
					<div className="setting" key="ease">
						<SelectEnum
							label="Easing"
							fullWidth
							currentValue={transition.easing}
							options={Ease}
							defaultValue={Ease.LINEAR}
							onChange={(v) => {
								transition.easing = v
								onSave(obj)
							}}
						/>
					</div>
				)
			}
		}

		if (transition.type === Transition.CUT) {
			// No settings
		} else if (transition.type === Transition.MIX) {
			// No more settings
		} else if (
			transition.type === Transition.PUSH ||
			transition.type === Transition.SLIDE ||
			transition.type === Transition.WIPE
		) {
			if (showAll || transition.direction !== undefined) {
				mixSettings.push(
					<div className="setting" key="direction">
						<SelectEnum
							label="Direction"
							fullWidth
							currentValue={transition.direction}
							options={Direction}
							defaultValue={Direction.LEFT}
							onChange={(v) => {
								transition.direction = v
								onSave(obj)
							}}
						/>
					</div>
				)
			}
		} else if (transition.type === Transition.STING) {
			if (showAll || transition.maskFile !== undefined) {
				mixSettings.push(
					<div className="setting" key="maskFile">
						<TextInput
							label="Mask File"
							fullWidth
							currentValue={transition.maskFile}
							onChange={(v) => {
								transition.maskFile = v
								onSave(obj)
							}}
							allowUndefined={false}
						/>
					</div>
				)
			}
			if (showAll || transition.overlayFile !== undefined) {
				mixSettings.push(
					<div className="setting" key="overlayFile">
						<TextInput
							label="Overlay File"
							fullWidth
							currentValue={transition.overlayFile}
							onChange={(v) => {
								transition.overlayFile = v
								onSave(obj)
							}}
							allowUndefined={true}
						/>
					</div>
				)
			}
			if (showAll || transition.delay !== undefined) {
				mixSettings.push(
					<div className="setting" key="delay">
						<DurationInput
							label="Delay"
							fullWidth
							currentValue={transition.delay}
							onChange={(v) => {
								transition.delay = v
								onSave(obj)
							}}
							allowUndefined={true}
						/>
					</div>
				)
			}
			if (showAll || transition.audioFadeStart !== undefined) {
				mixSettings.push(
					<div className="setting" key="audioFadeStart">
						<DurationInput
							label="Audio Fade start"
							fullWidth
							currentValue={transition.audioFadeStart}
							onChange={(v) => {
								transition.audioFadeStart = v
								onSave(obj)
							}}
							allowUndefined={true}
						/>
					</div>
				)
			}
			if (showAll || transition.audioFadeDuration !== undefined) {
				mixSettings.push(
					<div className="setting" key="audioFadeDuration">
						<DurationInput
							label="Audio Fade duration"
							fullWidth
							currentValue={transition.audioFadeDuration}
							onChange={(v) => {
								transition.audioFadeDuration = v
								onSave(obj)
							}}
							allowUndefined={true}
						/>
					</div>
				)
			}
		} else if (transition.type === Transition.TSR_TRANSITION) {
			// Hackish implementation in TSR:
			if (!(transition as any).customOptions) (transition as any).customOptions = {}
			const customOptions: TSRTransitionOptions = (transition as any).customOptions

			if (showAll || customOptions.updateInterval !== undefined) {
				mixSettings.push(
					<div className="setting" key="updateInterval">
						<DurationInput
							label="Update Interval"
							fullWidth
							currentValue={customOptions.updateInterval}
							onChange={(v) => {
								customOptions.updateInterval = v
								onSave(obj)
							}}
							allowUndefined={true}
						/>
					</div>
				)
			}
			if (showAll || customOptions.linearSpeed !== undefined) {
				mixSettings.push(
					<div className="setting" key="linearSpeed">
						<FloatInput
							label="Linear Speed"
							fullWidth
							currentValue={customOptions.linearSpeed}
							onChange={(v) => {
								customOptions.linearSpeed = v
								onSave(obj)
							}}
							allowUndefined={true}
						/>
					</div>
				)
			}
			if (showAll || customOptions.acceleration !== undefined) {
				mixSettings.push(
					<div className="setting" key="acceleration">
						<FloatInput
							label="Acceleration"
							fullWidth
							currentValue={customOptions.acceleration}
							onChange={(v) => {
								customOptions.acceleration = v
								onSave(obj)
							}}
							allowUndefined={true}
						/>
					</div>
				)
			}
			if (showAll || customOptions.maxSpeed !== undefined) {
				mixSettings.push(
					<div className="setting" key="maxSpeed">
						<FloatInput
							label="Max Speed"
							fullWidth
							currentValue={customOptions.maxSpeed}
							onChange={(v) => {
								customOptions.maxSpeed = v
								onSave(obj)
							}}
							allowUndefined={true}
						/>
					</div>
				)
			}
			if (showAll || customOptions.snapDistance !== undefined) {
				mixSettings.push(
					<div className="setting" key="snapDistance">
						<IntInput
							label="Snap Distance"
							fullWidth
							currentValue={customOptions.snapDistance}
							onChange={(v) => {
								customOptions.snapDistance = v
								onSave(obj)
							}}
							allowUndefined={true}
						/>
					</div>
				)
			}
		} else {
			assertNever(transition.type)
		}
		if (mixSettings.length > 0) {
			el.push(
				<div className="settings-group" key="group">
					{...mixSettings}
				</div>
			)
		}
		return el
	}

	const getSettingsMixer = (obj: TimelineObjCasparCGAny & { content: TimelineObjCCGProducerContentBase }) => {
		if (!obj.content.mixer) obj.content.mixer = {}

		const mixer = obj.content.mixer

		const mixSettings: JSX.Element[] = []

		if (showAll || mixer.fill !== undefined) {
			const fill: {
				x: number
				y: number
				xScale: number
				yScale: number
			} = (mixer.fill as any) ?? {
				x: 0,
				y: 0,
				xScale: 1,
				yScale: 1,
			}
			mixSettings.push(
				<div className="setting" key="fill.x">
					<FloatInput
						label="Fill x"
						fullWidth
						currentValue={fill.x}
						onChange={(v) => {
							mixer.fill = fill
							fill.x = v
							onSave(obj)
						}}
						allowUndefined={false}
						percentage={true}
						endAdornment={<AnalogInputOverridePicker />}
					/>
				</div>
			)
			mixSettings.push(
				<div className="setting" key="fill.y">
					<FloatInput
						label="Fill y"
						fullWidth
						currentValue={fill.y}
						onChange={(v) => {
							mixer.fill = fill
							fill.y = v
							onSave(obj)
						}}
						allowUndefined={false}
						percentage={true}
						endAdornment={<AnalogInputOverridePicker />}
					/>
				</div>
			)
			mixSettings.push(
				<div className="setting" key="fill.xScale">
					<FloatInput
						label="Fill x-scale"
						fullWidth
						currentValue={fill.xScale}
						onChange={(v) => {
							mixer.fill = fill
							fill.xScale = v
							onSave(obj)
						}}
						allowUndefined={false}
						percentage={true}
						endAdornment={<AnalogInputOverridePicker />}
					/>
				</div>
			)
			mixSettings.push(
				<div className="setting" key="fill.yScale">
					<FloatInput
						label="Fill Y-Scale"
						fullWidth
						currentValue={fill.yScale}
						onChange={(v) => {
							mixer.fill = fill
							fill.yScale = v
							onSave(obj)
						}}
						allowUndefined={false}
						percentage={true}
						endAdornment={<AnalogInputOverridePicker />}
					/>
				</div>
			)
		}

		return <>{mixSettings}</>
	}

	const analogInputOptions = useMemoComputedObject(() => {
		const options: { [key: string]: string } = {}

		for (const [datastoreKey, setting] of Object.entries(store.projectStore.project.analogInputSettings)) {
			options[setting.label] = datastoreKey
		}

		return options
	}, [])

	const getSettingsReferences = (obj: TSRTimelineObj, analogInputOptions: { [key: string]: string }) => {
		const settings: JSX.Element[] = []

		const attributesOptions: { [key: string]: string } = {}
		const gatherAttributes = (obj: any, path: string[]) => {
			if (typeof obj === 'object') {
				for (const [key, value] of Object.entries(obj)) {
					gatherAttributes(value, [...path, key])
				}
			} else {
				const pathStr = path.join('.')
				attributesOptions[pathStr] = pathStr
			}
		}

		const content = (obj as TSRTimelineObjBase).content

		if (content.$references) {
			gatherAttributes(_.omit(content, '$references', 'deviceType', 'type'), [])

			const references = content.$references
			for (const [localPath, ref] of Object.entries(references)) {
				settings.push(
					<div key={localPath} className="settings-group">
						<div className="setting">
							<SelectEnum
								label="Attribute to override"
								fullWidth
								currentValue={localPath}
								options={attributesOptions}
								onChange={(v) => {
									references[v] = references[localPath]
									delete references[localPath]
									onSave(obj)
								}}
							/>
						</div>
						<div className="setting">
							<SelectEnum
								label="Analog Input to use"
								fullWidth
								currentValue={ref.datastoreKey}
								options={analogInputOptions}
								onChange={(v) => {
									references[localPath].datastoreKey = v
									onSave(obj)
								}}
							/>
						</div>
						<div className="setting">
							<TextBtn
								label="Remove"
								onClick={() => {
									delete references[localPath]
									onSave(obj)
								}}
							/>
						</div>
					</div>
				)
			}
		}

		return (
			<>
				{settings}
				<div className="setting">
					<TextBtn
						label="Add Analog input reference"
						onClick={() => {
							if (!content.$references) {
								content.$references = {}
							}
							content.$references['__attribute'] = {
								datastoreKey: '',
								overwrite: false,
							}

							onSave(obj)
						}}
					/>
				</div>
			</>
		)
	}

	const showAllButton = showAll ? (
		<Link href="#" onClick={() => setShowAll(false)}>
			Hide more settings
		</Link>
	) : (
		<Link href="#" onClick={() => setShowAll(true)}>
			Show more settings
		</Link>
	)

	const obj0 = obj

	if (obj.content.type === TimelineContentTypeCasparCg.MEDIA) {
		const obj = obj0 as TimelineObjCCGMedia
		settings = (
			<>
				<div className="setting">
					<TextInput
						label="Filename"
						fullWidth
						currentValue={obj.content.file}
						onChange={(v) => {
							obj.content.file = v
							onSave(obj)
						}}
						allowUndefined={false}
					/>
				</div>
				<div className="setting">
					<BooleanInput
						label="Looping content"
						currentValue={obj.content.loop}
						onChange={(v) => {
							obj.content.loop = v
							onSave(obj)
						}}
					/>
				</div>

				{showAll ||
				obj.content.seek !== undefined ||
				obj.content.inPoint !== undefined ||
				obj.content.length !== undefined ? (
					<>
						<div className="setting">
							<DurationInput
								label="Seek"
								fullWidth
								currentValue={obj.content.seek}
								onChange={(v) => {
									obj.content.seek = v
									onSave(obj)
								}}
								allowUndefined={true}
							/>
						</div>
						<div className="setting">
							<DurationInput
								label="In Point (ie loop start point)"
								fullWidth
								currentValue={obj.content.inPoint}
								onChange={(v) => {
									obj.content.inPoint = v
									onSave(obj)
								}}
								allowUndefined={true}
							/>
						</div>
						<div className="setting">
							<DurationInput
								label="Length (ie point of freeze/loop)"
								fullWidth
								currentValue={obj.content.length}
								onChange={(v) => {
									obj.content.length = v
									onSave(obj)
								}}
								allowUndefined={true}
							/>
						</div>
					</>
				) : null}

				{/* <div className="setting">
					<label>noStarttime</label>
					<BooleanInput
						currentValue={obj.content.noStarttime}
						onChange={(v) => {
							obj.content.noStarttime = v
							onSave(obj)
						}}
					/>
				</div> */}
				{getSettingsChannelLayout(obj)}
				{getSettingsVideoAudioFilters(obj)}
				{getSettingsMixer(obj)}
				{getSettingsTransitions(obj)}
				{getSettingsReferences(obj, analogInputOptions)}

				{showAllButton}
			</>
		)
	} else if (obj.content.type === TimelineContentTypeCasparCg.IP) {
		const obj = obj0 as TimelineObjCCGIP
		settings = (
			<>
				<div className="setting">
					<TextInput
						label="URI"
						fullWidth
						currentValue={obj.content.uri}
						onChange={(v) => {
							obj.content.uri = v
							onSave(obj)
						}}
						allowUndefined={false}
					/>
				</div>
				{getSettingsChannelLayout(obj)}
				{getSettingsVideoAudioFilters(obj)}
				{getSettingsTransitions(obj)}

				{showAllButton}
			</>
		)
	} else if (obj.content.type === TimelineContentTypeCasparCg.INPUT) {
		const obj = obj0 as TimelineObjCCGInput
		settings = (
			<>
				<div className="setting">
					<TextInput
						label='Input Type (eg "decklink")'
						fullWidth
						currentValue={obj.content.inputType}
						onChange={(v) => {
							obj.content.inputType = v
							onSave(obj)
						}}
						allowUndefined={false}
					/>
				</div>
				<div className="setting">
					<IntInput
						label="Device Number"
						fullWidth
						currentValue={obj.content.device}
						onChange={(v) => {
							obj.content.device = v
							onSave(obj)
						}}
						allowUndefined={false}
						caps={[0, 99]}
					/>
				</div>
				<div className="setting">
					<SelectEnum
						label="Device Format"
						fullWidth
						currentValue={obj.content.deviceFormat}
						options={ChannelFormat}
						onChange={(v) => {
							obj.content.deviceFormat = v
							onSave(obj)
						}}
					/>
				</div>
				<div className="setting">
					<TextInput
						label="Filter"
						fullWidth
						currentValue={obj.content.filter}
						onChange={(v) => {
							obj.content.filter = v
							onSave(obj)
						}}
						allowUndefined={true}
					/>
				</div>

				{getSettingsChannelLayout(obj)}
				{getSettingsVideoAudioFilters(obj)}
				{getSettingsTransitions(obj)}

				{showAllButton}
			</>
		)
	} else if (obj.content.type === TimelineContentTypeCasparCg.TEMPLATE) {
		const obj = obj0 as TimelineObjCCGTemplate
		settings = (
			<>
				<div className="setting">
					<SelectEnum
						label="Template Type"
						fullWidth
						currentValue={obj.content.templateType}
						options={{ html: 'HTML', flash: 'Flash' }}
						onChange={(v) => {
							obj.content.templateType = v
							onSave(obj)
						}}
						defaultValue={'html'}
					/>
				</div>
				<div className="setting">
					<TextInput
						label="Name"
						fullWidth
						currentValue={obj.content.name}
						onChange={(v) => {
							obj.content.name = v
							onSave(obj)
						}}
						allowUndefined={false}
					/>
				</div>
				<div className="setting">
					<BooleanInput
						label="Send stop() on stop"
						currentValue={obj.content.useStopCommand}
						onChange={(v) => {
							obj.content.useStopCommand = v
							onSave(obj)
						}}
					/>
				</div>

				<CasparEditTemplateData obj={obj} onSave={onSave} />

				{getSettingsTransitions(obj)}

				{showAllButton}
			</>
		)
	} else if (obj.content.type === TimelineContentTypeCasparCg.HTMLPAGE) {
		const obj = obj0 as TimelineObjCCGHTMLPage
		settings = (
			<>
				<div className="setting">
					<TextInput
						label="URL"
						fullWidth
						currentValue={obj.content.url}
						onChange={(v) => {
							obj.content.url = v
							onSave(obj)
						}}
						allowUndefined={false}
					/>
				</div>
			</>
		)
	} else if (obj.content.type === TimelineContentTypeCasparCg.ROUTE) {
		const obj = obj0 as TimelineObjCCGRoute & { content: { __routeMappedLayer?: boolean } }

		settings = (
			<>
				<div className="setting">
					<TextInput
						label="mappedLayer"
						fullWidth
						currentValue={obj.content.mappedLayer}
						onChange={(v) => {
							obj.content.mappedLayer = v
							onSave(obj)
						}}
						allowUndefined={true}
					/>
				</div>

				{!obj.content.mappedLayer ? (
					<>
						<div className="setting">
							<IntInput
								label="Channel"
								fullWidth
								currentValue={obj.content.channel}
								onChange={(v) => {
									obj.content.channel = v
									onSave(obj)
								}}
								allowUndefined={true}
								caps={[0, 999]}
							/>
						</div>
						<div className="setting">
							<IntInput
								label="Layer"
								fullWidth
								currentValue={obj.content.layer}
								onChange={(v) => {
									obj.content.layer = v
									onSave(obj)
								}}
								allowUndefined={true}
								caps={[0, 999]}
							/>
						</div>
					</>
				) : null}

				<div className="setting">
					<SelectEnum
						label="Mode"
						fullWidth
						currentValue={obj.content.mode}
						options={{
							BACKGROUND: 'BACKGROUND',
							NEXT: 'NEXT',
						}}
						onChange={(v) => {
							obj.content.mode = v
							onSave(obj)
						}}
						allowUndefined={true}
					/>
				</div>
				<div className="setting">
					<DurationInput
						label="Delay"
						fullWidth
						currentValue={obj.content.delay}
						onChange={(v) => {
							obj.content.delay = v
							onSave(obj)
						}}
						allowUndefined={true}
					/>
				</div>

				{getSettingsChannelLayout(obj)}
				{getSettingsVideoAudioFilters(obj)}
				{getSettingsTransitions(obj)}
				{showAllButton}
			</>
		)
	} else if (obj.content.type === TimelineContentTypeCasparCg.RECORD) {
		const obj = obj0 as TimelineObjCCGRecord

		settings = (
			<>
				<div className="setting">
					<TextInput
						label="File name"
						fullWidth
						currentValue={obj.content.file}
						onChange={(v) => {
							obj.content.file = v
							onSave(obj)
						}}
						allowUndefined={false}
					/>
				</div>
				<div className="setting">
					<TextInput
						label="Encoder Options"
						fullWidth
						currentValue={obj.content.encoderOptions}
						onChange={(v) => {
							obj.content.encoderOptions = v
							onSave(obj)
						}}
						allowUndefined={false}
					/>
				</div>
			</>
		)
	} else {
		assertNever(obj.content)
	}

	return (
		<EditWrapper obj={obj} onSave={onSave}>
			{commonSettings}
			{settings}
		</EditWrapper>
	)
}

const CasparEditTemplateData: React.FC<{
	obj: TimelineObjCCGTemplate
	onSave: OnSave
}> = ({ obj, onSave }) => {
	let parsed: { [id: string]: string } = {}
	try {
		if (typeof obj.content.data === 'string') {
			parsed = JSON.parse(obj.content.data)
		} else {
			parsed = obj.content.data
		}
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error(err)
	}

	const handleUpdateValue = (key: string, newValue: string) => {
		const newData = deepClone(parsed)
		const newObj = deepClone(obj)
		newObj.content.data = newData
		newData[key] = newValue
		onSave(newObj)
	}
	const handleUpdateKey = (oldKey: string, newKey: string) => {
		const newData = deepClone(parsed)
		const newObj = deepClone(obj)
		newObj.content.data = newData
		if (newKey !== oldKey) {
			newData[newKey] = newData[oldKey]
			delete newData[oldKey]
			onSave(newObj)
		}
	}

	const handleAddNew = () => {
		const newData = deepClone(parsed)
		const newObj = deepClone(obj)
		newObj.content.data = newData

		for (let i = 0; i < 100; i++) {
			const key = `f${i}`
			if (newData[key] === undefined) {
				newData[key] = ''
				break
			}
		}
		onSave(newObj)
	}

	const handleDelete = (key: string) => {
		const newData = deepClone(parsed)
		const newObj = deepClone(obj)
		newObj.content.data = newData
		delete newData[key]
		onSave(newObj)
	}

	const data: Array<any> = []
	Object.keys(parsed).forEach((key) => {
		data.push({
			key: key,
			value: parsed[key],
		})
	})

	return (
		<>
			<div className="setting">
				<BooleanInput
					label="Classic CasparCG XML Data"
					currentValue={(obj.content as any).sendDataAsXML}
					onChange={(v) => {
						;(obj.content as any).sendDataAsXML = v
						onSave(obj)
					}}
				/>
			</div>
			<div className="casparcg-template-data">
				<table className="table">
					<thead>
						<tr>
							<th>Key</th>
							<th>Value</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td colSpan={3}></td>
						</tr>
						{Object.entries(parsed).map(([key, value]) => {
							return (
								<tr key={key}>
									<td className="key">
										<TextInput
											label="Key"
											currentValue={key}
											onChange={(v) => {
												handleUpdateKey(key, v)
											}}
											allowUndefined={false}
										/>
									</td>
									<td>
										<TextInput
											label="Value"
											currentValue={value}
											onChange={(v) => {
												handleUpdateValue(key, v)
											}}
											allowUndefined={false}
										/>
									</td>
									<td>
										<TrashBtn
											className="delete"
											title={'Delete'}
											onClick={() => {
												handleDelete(key)
											}}
										/>
									</td>
								</tr>
							)
						})}

						<tr>
							<td colSpan={3}>
								<AddBtn
									title="Add"
									onClick={() => {
										handleAddNew()
									}}
								/>
							</td>
						</tr>
					</tbody>
				</table>

				<div className="btn-row-right">
					<Btn variant="contained" onClick={handleAddNew}>
						Add
					</Btn>
				</div>
			</div>
		</>
	)
}
