import React from 'react'
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
	TSRTransitionOptions,
	BlendMode,
	Chroma,
	DeviceType,
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
import { AnalogInputOverridePicker } from '../../../inputs/AnalogInputPicker/AnalogInputPicker'
import { HiOutlineX } from 'react-icons/hi'
import { store } from '../../../../mobx/store'
import { computed } from 'mobx'
import { ResourceType } from '@shared/models'
import { usePromise } from '../../../../mobx/lib'
import { EditGDDData } from '../GDD/gddEdit'
import { GDDSchema } from 'graphics-data-definition'

export const EditTimelineObjCasparCGAny: React.FC<{
	obj: TimelineObjCasparCGAny
	resourceId: string | undefined
	onSave: OnSave
}> = ({ obj, resourceId, onSave }) => {
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

						const sharedContentProps = <T extends TimelineContentTypeCasparCg>(
							type: T
						): {
							deviceType: DeviceType.CASPARCG
							type: T
						} => {
							return {
								deviceType: DeviceType.CASPARCG,
								type,
							}
						}

						// Create new content that is appropriate for the new CCG timelineObj type
						switch (obj.content.type) {
							case TimelineContentTypeCasparCg.HTMLPAGE: {
								obj.content = {
									...sharedContentProps(obj.content.type),
									url: '',
								}
								break
							}
							case TimelineContentTypeCasparCg.INPUT: {
								obj.content = {
									...sharedContentProps(obj.content.type),
									inputType: '',
									device: 0,
									deviceFormat: ChannelFormat.HD_1080P2500,
								}
								break
							}
							case TimelineContentTypeCasparCg.IP: {
								obj.content = {
									...sharedContentProps(obj.content.type),
									uri: '',
								}
								break
							}
							case TimelineContentTypeCasparCg.MEDIA: {
								obj.content = {
									...sharedContentProps(obj.content.type),
									file: '',
								}
								break
							}
							case TimelineContentTypeCasparCg.RECORD: {
								obj.content = {
									...sharedContentProps(obj.content.type),
									file: '',
									encoderOptions: '',
								}
								break
							}
							case TimelineContentTypeCasparCg.ROUTE: {
								obj.content = {
									...sharedContentProps(obj.content.type),
								}
								break
							}
							case TimelineContentTypeCasparCg.TEMPLATE: {
								obj.content = {
									...sharedContentProps(obj.content.type),
									templateType: 'html',
									name: '',
									useStopCommand: false,
									data: {},
								}
								break
							}
							default:
								assertNever(obj.content)
						}

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

		const inTransitions = getSettingsTransitionInner(obj, obj.content.transitions.inTransition, 'In')
		const outTransitions = getSettingsTransitionInner(obj, obj.content.transitions.outTransition, 'Out')

		if (inTransitions.length || outTransitions.length) {
			return (
				<>
					<div className="label">Transitions</div>
					{inTransitions}
					<div className="setting-separator"></div>
					{outTransitions}
				</>
			)
		}
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

		if (showAll || mixer.anchor !== undefined) {
			const anchor: {
				x: number
				y: number
			} = (mixer.anchor as any) ?? {
				x: 0,
				y: 0,
			}
			mixSettings.push(
				<div className="settings-group" key="anchor">
					<div className="label">
						Anchor
						{mixer.anchor !== undefined && (
							<Btn
								className="size-small"
								onClick={() => {
									delete mixer.anchor
									onSave(obj)
								}}
							>
								<HiOutlineX />
							</Btn>
						)}
					</div>
					<div className="setting">
						<FloatInput
							label="Anchor x"
							fullWidth
							currentValue={anchor.x}
							onChange={(v) => {
								mixer.anchor = anchor
								anchor.x = v
								onSave(obj)
							}}
							allowUndefined={false}
							percentage={true}
							endAdornment={<AnalogInputOverridePicker obj={obj} path="mixer.anchor.x" onSave={onSave} />}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="anchor y"
							fullWidth
							currentValue={anchor.y}
							onChange={(v) => {
								mixer.anchor = anchor
								anchor.y = v
								onSave(obj)
							}}
							allowUndefined={false}
							percentage={true}
							endAdornment={<AnalogInputOverridePicker obj={obj} path="mixer.anchor.y" onSave={onSave} />}
						/>
					</div>
				</div>
			)
		}
		if (showAll || mixer.blend !== undefined) {
			mixSettings.push(
				<div className="settings-group" key="blend">
					<div className="label">
						Blend
						{mixer.blend !== undefined && (
							<Btn
								className="size-small"
								onClick={() => {
									delete mixer.blend
									onSave(obj)
								}}
							>
								<HiOutlineX />
							</Btn>
						)}
					</div>
					<div className="setting">
						<SelectEnum
							label="Blend mode"
							fullWidth
							currentValue={mixer.blend}
							onChange={(v) => {
								mixer.blend = v
								onSave(obj)
							}}
							allowUndefined={false}
							options={BlendMode}
							defaultValue={BlendMode.NORMAL}
						/>
					</div>
				</div>
			)
		}
		if (showAll || mixer.brightness !== undefined) {
			mixSettings.push(
				<div className="settings-group" key="brightness">
					<div className="label">
						Brightness
						{mixer.brightness !== undefined && (
							<Btn
								className="size-small"
								onClick={() => {
									delete mixer.brightness
									onSave(obj)
								}}
							>
								<HiOutlineX />
							</Btn>
						)}
					</div>
					<div className="setting">
						<FloatInput
							label="Brightness"
							fullWidth
							currentValue={mixer.brightness as any}
							onChange={(v) => {
								mixer.brightness = v
								onSave(obj)
							}}
							caps={[0, 1]}
							percentage={true}
							allowUndefined={false}
							defaultValue={1}
							endAdornment={
								<AnalogInputOverridePicker obj={obj} path="mixer.brightness" onSave={onSave} />
							}
						/>
					</div>
				</div>
			)
		}
		if (showAll || mixer.chroma !== undefined) {
			const chroma: {
				keyer: Chroma
				threshold: number
				softness: number
				spill: number
			} = (mixer.chroma as any) ?? {
				keyer: Chroma.NONE,
				threshold: 0,
				softness: 0,
				spill: 0,
			}
			mixSettings.push(
				<div className="settings-group" key="chroma">
					<div className="label">
						Chroma
						{mixer.chroma !== undefined && (
							<Btn
								className="size-small"
								onClick={() => {
									delete mixer.chroma
									onSave(obj)
								}}
							>
								<HiOutlineX />
							</Btn>
						)}
					</div>
					<div className="setting">
						<SelectEnum
							label="Keyer"
							fullWidth
							currentValue={chroma.keyer}
							onChange={(v) => {
								mixer.chroma = chroma
								chroma.keyer = v
								onSave(obj)
							}}
							allowUndefined={false}
							options={Chroma}
							defaultValue={Chroma.NONE}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="Threshold"
							fullWidth
							currentValue={chroma.threshold}
							onChange={(v) => {
								mixer.chroma = chroma
								chroma.threshold = v
								onSave(obj)
							}}
							allowUndefined={false}
							percentage={true}
							endAdornment={
								<AnalogInputOverridePicker obj={obj} path="mixer.chroma.threshold" onSave={onSave} />
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="Softness"
							fullWidth
							currentValue={chroma.softness}
							onChange={(v) => {
								mixer.chroma = chroma
								chroma.softness = v
								onSave(obj)
							}}
							allowUndefined={false}
							percentage={true}
							endAdornment={
								<AnalogInputOverridePicker obj={obj} path="mixer.chroma.softness" onSave={onSave} />
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="Spill"
							fullWidth
							currentValue={chroma.spill}
							onChange={(v) => {
								mixer.chroma = chroma
								chroma.spill = v
								onSave(obj)
							}}
							allowUndefined={false}
							percentage={true}
							endAdornment={
								<AnalogInputOverridePicker obj={obj} path="mixer.chroma.spill" onSave={onSave} />
							}
						/>
					</div>
				</div>
			)
		}
		if (showAll || mixer.clip !== undefined) {
			const clip: {
				x: number
				y: number
				width: number
				height: number
			} = (mixer.clip as any) ?? {
				x: 0,
				y: 0,
				width: 1,
				height: 1,
			}
			mixSettings.push(
				<div className="settings-group" key="clip">
					<div className="label">
						Mixer clip
						{mixer.clip !== undefined && (
							<Btn
								className="size-small"
								onClick={() => {
									delete mixer.clip
									onSave(obj)
								}}
							>
								<HiOutlineX />
							</Btn>
						)}
					</div>
					<div className="setting">
						<FloatInput
							label="Clip x"
							fullWidth
							currentValue={clip.x}
							onChange={(v) => {
								mixer.clip = clip
								clip.x = v
								onSave(obj)
							}}
							allowUndefined={false}
							percentage={true}
							caps={[0, 1]}
							endAdornment={<AnalogInputOverridePicker obj={obj} path="mixer.clip.x" onSave={onSave} />}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="Clip y"
							fullWidth
							currentValue={clip.y}
							onChange={(v) => {
								mixer.clip = clip
								clip.y = v
								onSave(obj)
							}}
							allowUndefined={false}
							percentage={true}
							caps={[0, 1]}
							endAdornment={<AnalogInputOverridePicker obj={obj} path="mixer.clip.y" onSave={onSave} />}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="Clip width"
							fullWidth
							currentValue={clip.width}
							onChange={(v) => {
								mixer.clip = clip
								clip.width = v
								onSave(obj)
							}}
							allowUndefined={false}
							percentage={true}
							caps={[0, 1]}
							defaultValue={1}
							endAdornment={
								<AnalogInputOverridePicker obj={obj} path="mixer.clip.width" onSave={onSave} />
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="Clip height"
							fullWidth
							currentValue={clip.height}
							onChange={(v) => {
								mixer.clip = clip
								clip.height = v
								onSave(obj)
							}}
							allowUndefined={false}
							percentage={true}
							caps={[0, 1]}
							defaultValue={1}
							endAdornment={
								<AnalogInputOverridePicker obj={obj} path="mixer.clip.height" onSave={onSave} />
							}
						/>
					</div>
				</div>
			)
		}
		if (showAll || mixer.contrast !== undefined) {
			mixSettings.push(
				<div className="settings-group" key="contrast">
					<div className="label">
						Contrast
						{mixer.contrast !== undefined && (
							<Btn
								className="size-small"
								onClick={() => {
									delete mixer.contrast
									onSave(obj)
								}}
							>
								<HiOutlineX />
							</Btn>
						)}
					</div>
					<div className="setting">
						<FloatInput
							label="Contrast"
							fullWidth
							currentValue={mixer.contrast as any}
							onChange={(v) => {
								mixer.contrast = v
								onSave(obj)
							}}
							caps={[0, 1]}
							percentage={true}
							allowUndefined={false}
							defaultValue={1}
							endAdornment={<AnalogInputOverridePicker obj={obj} path="mixer.contrast" onSave={onSave} />}
						/>
					</div>
				</div>
			)
		}
		if (showAll || mixer.crop !== undefined) {
			const crop: {
				left: number
				top: number
				right: number
				bottom: number
			} = (mixer.crop as any) ?? {
				left: 0,
				top: 0,
				right: 1,
				bottom: 1,
			}
			mixSettings.push(
				<div className="settings-group" key="crop">
					<div className="label">
						Mixer crop
						{mixer.crop !== undefined && (
							<Btn
								className="size-small"
								onClick={() => {
									delete mixer.crop
									onSave(obj)
								}}
							>
								<HiOutlineX />
							</Btn>
						)}
					</div>
					<div className="setting">
						<FloatInput
							label="Crop left"
							fullWidth
							currentValue={crop.left}
							onChange={(v) => {
								mixer.crop = crop
								crop.left = v
								onSave(obj)
							}}
							allowUndefined={false}
							percentage={true}
							caps={[0, 1]}
							endAdornment={
								<AnalogInputOverridePicker obj={obj} path="mixer.crop.left" onSave={onSave} />
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="Crop top"
							fullWidth
							currentValue={crop.top}
							onChange={(v) => {
								mixer.crop = crop
								crop.top = v
								onSave(obj)
							}}
							allowUndefined={false}
							percentage={true}
							caps={[0, 1]}
							endAdornment={<AnalogInputOverridePicker obj={obj} path="mixer.crop.top" onSave={onSave} />}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="crop right"
							fullWidth
							currentValue={crop.right}
							onChange={(v) => {
								mixer.crop = crop
								crop.right = v
								onSave(obj)
							}}
							allowUndefined={false}
							percentage={true}
							caps={[0, 1]}
							defaultValue={1}
							endAdornment={
								<AnalogInputOverridePicker obj={obj} path="mixer.crop.right" onSave={onSave} />
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="crop bottom"
							fullWidth
							currentValue={crop.bottom}
							onChange={(v) => {
								mixer.crop = crop
								crop.bottom = v
								onSave(obj)
							}}
							allowUndefined={false}
							percentage={true}
							caps={[0, 1]}
							defaultValue={1}
							endAdornment={
								<AnalogInputOverridePicker obj={obj} path="mixer.crop.bottom" onSave={onSave} />
							}
						/>
					</div>
				</div>
			)
		}
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
				<div className="settings-group" key="fill">
					<div className="label">
						Mixer Fill
						{mixer.fill !== undefined && (
							<Btn
								className="size-small"
								onClick={() => {
									delete mixer.fill
									onSave(obj)
								}}
							>
								<HiOutlineX />
							</Btn>
						)}
					</div>
					<div className="setting">
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
							endAdornment={<AnalogInputOverridePicker obj={obj} path="mixer.fill.x" onSave={onSave} />}
						/>
					</div>
					<div className="setting">
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
							endAdornment={<AnalogInputOverridePicker obj={obj} path="mixer.fill.y" onSave={onSave} />}
						/>
					</div>
					<div className="setting">
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
							defaultValue={1}
							endAdornment={
								<AnalogInputOverridePicker obj={obj} path="mixer.fill.xScale" onSave={onSave} />
							}
						/>
					</div>
					<div className="setting">
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
							defaultValue={1}
							endAdornment={
								<AnalogInputOverridePicker obj={obj} path="mixer.fill.yScale" onSave={onSave} />
							}
						/>
					</div>
				</div>
			)
		}
		if (showAll || mixer.keyer !== undefined) {
			mixSettings.push(
				<div className="settings-group" key="keyer">
					<div className="label">
						Keyer
						{mixer.keyer !== undefined && (
							<Btn
								className="size-small"
								onClick={() => {
									delete mixer.keyer
									onSave(obj)
								}}
							>
								<HiOutlineX />
							</Btn>
						)}
					</div>
					<div className="setting">
						<BooleanInput
							label="Keyer"
							currentValue={mixer.keyer as any}
							onChange={(v) => {
								mixer.keyer = v
								onSave(obj)
							}}
						/>
					</div>
				</div>
			)
		}
		if (showAll || mixer.levels !== undefined) {
			const levels: {
				minInput: number
				maxInput: number
				gamma: number
				minOutput: number
				maxOutput: number
			} = (mixer.levels as any) ?? {
				minInput: 0,
				maxInput: 1,
				gamma: 1,
				minOutput: 0,
				maxOutput: 1,
			}
			mixSettings.push(
				<div className="settings-group" key="levels">
					<div className="label">
						Mixer levels
						{mixer.levels !== undefined && (
							<Btn
								className="size-small"
								onClick={() => {
									delete mixer.levels
									onSave(obj)
								}}
							>
								<HiOutlineX />
							</Btn>
						)}
					</div>
					<div className="setting">
						<FloatInput
							label="levels minInput"
							fullWidth
							currentValue={levels.minInput}
							onChange={(v) => {
								mixer.levels = levels
								levels.minInput = v
								onSave(obj)
							}}
							allowUndefined={false}
							percentage={true}
							defaultValue={0}
							caps={[0, 1]}
							endAdornment={
								<AnalogInputOverridePicker obj={obj} path="mixer.levels.minInput" onSave={onSave} />
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="levels maxInput"
							fullWidth
							currentValue={levels.maxInput}
							onChange={(v) => {
								mixer.levels = levels
								levels.maxInput = v
								onSave(obj)
							}}
							allowUndefined={false}
							percentage={true}
							defaultValue={1}
							caps={[0, 1]}
							endAdornment={
								<AnalogInputOverridePicker obj={obj} path="mixer.levels.maxInput" onSave={onSave} />
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="levels gamma"
							fullWidth
							currentValue={levels.gamma}
							onChange={(v) => {
								mixer.levels = levels
								levels.gamma = v
								onSave(obj)
							}}
							allowUndefined={false}
							percentage={true}
							defaultValue={1}
							endAdornment={
								<AnalogInputOverridePicker obj={obj} path="mixer.levels.gamma" onSave={onSave} />
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="levels minOutput"
							fullWidth
							currentValue={levels.minOutput}
							onChange={(v) => {
								mixer.levels = levels
								levels.minOutput = v
								onSave(obj)
							}}
							allowUndefined={false}
							percentage={true}
							defaultValue={0}
							caps={[0, 1]}
							endAdornment={
								<AnalogInputOverridePicker obj={obj} path="mixer.levels.minOutput" onSave={onSave} />
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="levels maxOutput"
							fullWidth
							currentValue={levels.maxOutput}
							onChange={(v) => {
								mixer.levels = levels
								levels.maxOutput = v
								onSave(obj)
							}}
							allowUndefined={false}
							percentage={true}
							defaultValue={1}
							caps={[0, 1]}
							endAdornment={
								<AnalogInputOverridePicker obj={obj} path="mixer.levels.maxOutput" onSave={onSave} />
							}
						/>
					</div>
				</div>
			)
		}
		if (showAll || mixer.mastervolume !== undefined) {
			mixSettings.push(
				<div className="settings-group" key="mastervolume">
					<div className="label">
						Master Volume
						{mixer.mastervolume !== undefined && (
							<Btn
								className="size-small"
								onClick={() => {
									delete mixer.mastervolume
									onSave(obj)
								}}
							>
								<HiOutlineX />
							</Btn>
						)}
					</div>
					<div className="setting">
						<FloatInput
							label="Master Volume"
							fullWidth
							currentValue={mixer.mastervolume as any}
							onChange={(v) => {
								mixer.mastervolume = v
								onSave(obj)
							}}
							percentage={true}
							allowUndefined={false}
							defaultValue={1}
							endAdornment={
								<AnalogInputOverridePicker obj={obj} path="mixer.mastervolume" onSave={onSave} />
							}
						/>
					</div>
				</div>
			)
		}
		if (showAll || mixer.opacity !== undefined) {
			mixSettings.push(
				<div className="settings-group" key="opacity">
					<div className="label">
						Opacity
						{mixer.opacity !== undefined && (
							<Btn
								className="size-small"
								onClick={() => {
									delete mixer.opacity
									onSave(obj)
								}}
							>
								<HiOutlineX />
							</Btn>
						)}
					</div>
					<div className="setting">
						<FloatInput
							label="Opacity"
							fullWidth
							currentValue={mixer.opacity as any}
							onChange={(v) => {
								mixer.opacity = v
								onSave(obj)
							}}
							percentage={true}
							allowUndefined={false}
							caps={[0, 1]}
							endAdornment={<AnalogInputOverridePicker obj={obj} path="mixer.opacity" onSave={onSave} />}
						/>
					</div>
				</div>
			)
		}
		if (showAll || mixer.perspective !== undefined) {
			const perspective: {
				topLeftX: number
				topLeftY: number
				topRightX: number
				topRightY: number
				bottomRightX: number
				bottomRightY: number
				bottomLeftX: number
				bottomLeftY: number
			} = (mixer.perspective as any) ?? {
				topLeftX: 0,
				topLeftY: 0,
				topRightX: 1,
				topRightY: 0,
				bottomRightX: 1,
				bottomRightY: 1,
				bottomLeftX: 0,
				bottomLeftY: 1,
			}
			mixSettings.push(
				<div className="settings-group" key="perspective">
					<div className="label">
						Mixer perspective
						{mixer.perspective !== undefined && (
							<Btn
								className="size-small"
								onClick={() => {
									delete mixer.perspective
									onSave(obj)
								}}
							>
								<HiOutlineX />
							</Btn>
						)}
					</div>
					<div className="setting">
						<FloatInput
							label="topLeftX"
							fullWidth
							currentValue={perspective.topLeftX}
							onChange={(v) => {
								mixer.perspective = perspective
								perspective.topLeftX = v
								onSave(obj)
							}}
							allowUndefined={false}
							percentage={true}
							defaultValue={0}
							endAdornment={
								<AnalogInputOverridePicker
									obj={obj}
									path="mixer.perspective.topLeftX"
									onSave={onSave}
								/>
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="topLeftY"
							fullWidth
							currentValue={perspective.topLeftY}
							onChange={(v) => {
								mixer.perspective = perspective
								perspective.topLeftY = v
								onSave(obj)
							}}
							allowUndefined={false}
							percentage={true}
							defaultValue={0}
							endAdornment={
								<AnalogInputOverridePicker
									obj={obj}
									path="mixer.perspective.topLeftY"
									onSave={onSave}
								/>
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="topRightX"
							fullWidth
							currentValue={perspective.topRightX}
							onChange={(v) => {
								mixer.perspective = perspective
								perspective.topRightX = v
								onSave(obj)
							}}
							allowUndefined={false}
							percentage={true}
							defaultValue={1}
							endAdornment={
								<AnalogInputOverridePicker
									obj={obj}
									path="mixer.perspective.topRightX"
									onSave={onSave}
								/>
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="topRightY"
							fullWidth
							currentValue={perspective.topRightY}
							onChange={(v) => {
								mixer.perspective = perspective
								perspective.topRightY = v
								onSave(obj)
							}}
							allowUndefined={false}
							percentage={true}
							defaultValue={0}
							endAdornment={
								<AnalogInputOverridePicker
									obj={obj}
									path="mixer.perspective.topRightY"
									onSave={onSave}
								/>
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="bottomRightX"
							fullWidth
							currentValue={perspective.bottomRightX}
							onChange={(v) => {
								mixer.perspective = perspective
								perspective.bottomRightX = v
								onSave(obj)
							}}
							allowUndefined={false}
							percentage={true}
							defaultValue={1}
							endAdornment={
								<AnalogInputOverridePicker
									obj={obj}
									path="mixer.perspective.bottomRightX"
									onSave={onSave}
								/>
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="bottomRightY"
							fullWidth
							currentValue={perspective.bottomRightY}
							onChange={(v) => {
								mixer.perspective = perspective
								perspective.bottomRightY = v
								onSave(obj)
							}}
							allowUndefined={false}
							percentage={true}
							defaultValue={1}
							endAdornment={
								<AnalogInputOverridePicker
									obj={obj}
									path="mixer.perspective.bottomRightY"
									onSave={onSave}
								/>
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="bottomLeftX"
							fullWidth
							currentValue={perspective.bottomLeftX}
							onChange={(v) => {
								mixer.perspective = perspective
								perspective.bottomLeftX = v
								onSave(obj)
							}}
							allowUndefined={false}
							percentage={true}
							defaultValue={0}
							endAdornment={
								<AnalogInputOverridePicker
									obj={obj}
									path="mixer.perspective.bottomLeftX"
									onSave={onSave}
								/>
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="bottomLeftY"
							fullWidth
							currentValue={perspective.bottomLeftY}
							onChange={(v) => {
								mixer.perspective = perspective
								perspective.bottomLeftY = v
								onSave(obj)
							}}
							allowUndefined={false}
							percentage={true}
							defaultValue={1}
							endAdornment={
								<AnalogInputOverridePicker
									obj={obj}
									path="mixer.perspective.bottomLeftY"
									onSave={onSave}
								/>
							}
						/>
					</div>
				</div>
			)
		}
		if (showAll || mixer.rotation !== undefined) {
			mixSettings.push(
				<div className="settings-group" key="rotation">
					<div className="label">
						Rotation
						{mixer.rotation !== undefined && (
							<Btn
								className="size-small"
								onClick={() => {
									delete mixer.rotation
									onSave(obj)
								}}
							>
								<HiOutlineX />
							</Btn>
						)}
					</div>
					<div className="setting">
						<FloatInput
							label="rotation"
							fullWidth
							currentValue={mixer.rotation as any}
							onChange={(v) => {
								mixer.rotation = v
								onSave(obj)
							}}
							allowUndefined={false}
							defaultValue={0}
							endAdornment={<AnalogInputOverridePicker obj={obj} path="mixer.rotation" onSave={onSave} />}
						/>
					</div>
				</div>
			)
		}
		if (showAll || mixer.saturation !== undefined) {
			mixSettings.push(
				<div className="settings-group" key="saturation">
					<div className="label">
						Saturation
						{mixer.saturation !== undefined && (
							<Btn
								className="size-small"
								onClick={() => {
									delete mixer.saturation
									onSave(obj)
								}}
							>
								<HiOutlineX />
							</Btn>
						)}
					</div>
					<div className="setting">
						<FloatInput
							label="saturation"
							fullWidth
							currentValue={(mixer.saturation as any) ?? 1}
							onChange={(v) => {
								mixer.saturation = v
								onSave(obj)
							}}
							allowUndefined={false}
							percentage={true}
							defaultValue={1}
							caps={[0, 1]}
							endAdornment={
								<AnalogInputOverridePicker obj={obj} path="mixer.saturation" onSave={onSave} />
							}
						/>
					</div>
				</div>
			)
		}
		if (showAll || mixer.straightAlpha !== undefined) {
			mixSettings.push(
				<div className="settings-group" key="straightAlpha">
					<div className="label">
						Straight Alpha
						{mixer.straightAlpha !== undefined && (
							<Btn
								className="size-small"
								onClick={() => {
									delete mixer.straightAlpha
									onSave(obj)
								}}
							>
								<HiOutlineX />
							</Btn>
						)}
					</div>
					<div className="setting">
						<BooleanInput
							label="Straight Alpha"
							currentValue={mixer.straightAlpha as any}
							onChange={(v) => {
								mixer.straightAlpha = v
								onSave(obj)
							}}
						/>
					</div>
				</div>
			)
		}
		if (showAll || mixer.volume !== undefined) {
			mixSettings.push(
				<div className="settings-group" key="volume">
					<div className="label">
						Volume
						{mixer.volume !== undefined && (
							<Btn
								className="size-small"
								onClick={() => {
									delete mixer.volume
									onSave(obj)
								}}
							>
								<HiOutlineX />
							</Btn>
						)}
					</div>
					<div className="setting">
						<FloatInput
							label="Volume"
							fullWidth
							currentValue={mixer.volume as any}
							onChange={(v) => {
								mixer.volume = v
								onSave(obj)
							}}
							allowUndefined={false}
							percentage={true}
							defaultValue={1}
							endAdornment={<AnalogInputOverridePicker obj={obj} path="mixer.volume" onSave={onSave} />}
						/>
					</div>
				</div>
			)
		}

		return <>{mixSettings}</>
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

				<CasparEditTemplateData obj={obj} resourceId={resourceId} onSave={onSave} />

				{/* {showAllButton} */}
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
	resourceId: string | undefined
	onSave: OnSave
}> = ({ obj, resourceId, onSave }) => {
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

	const initializedGDDValidator = usePromise(() =>
		store.gddValidatorStore.initializeGDDSchemaValidator().then(() => true)
	)

	let errorMessage: string | null = null
	let gdd: {
		validationResult: string | null
		schema: GDDSchema
	} | null = null

	if (resourceId && initializedGDDValidator) {
		const resource = computed(() => store.resourcesStore.getResource(resourceId)).get()

		if (resource && resource.resourceType === ResourceType.CASPARCG_TEMPLATE) {
			if (resource.errorMessage) errorMessage = resource.errorMessage

			if (resource.gdd) {
				gdd = {
					schema: resource.gdd,
					validationResult: null,
				}

				store.gddValidatorStore.initializeGDDSchemaValidator().catch((window as any).handleError)
				const gddValidator = computed(() => store.gddValidatorStore.gddValidator).get()

				if (gddValidator) {
					gdd.validationResult = gddValidator(resource.gdd)
				}
			}
		}
	}
	if (errorMessage) {
		return (
			<>
				<div className="setting">
					Error in template:
					<div className="markable">{errorMessage}</div>
				</div>
			</>
		)
	}
	if (gdd) {
		if (gdd.validationResult) {
			return (
				<>
					<div className="setting">
						Error in Schema:
						<div className="markable">{gdd.validationResult}</div>
					</div>
				</>
			)
		}
		return (
			<>
				<div className="setting">
					{
						<EditGDDData
							data={obj.content.data}
							schema={gdd.schema}
							onSaveData={(data: any) => {
								const newObj = deepClone(obj)
								newObj.content.data = data
								onSave(newObj)
							}}
						/>
					}
				</div>
			</>
		)
	}

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
