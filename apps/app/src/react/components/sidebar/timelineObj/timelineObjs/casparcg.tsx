import React, { useState } from 'react'
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
	Mixer,
	CasparCGTransition,
} from 'timeline-state-resolver-types'
import { EditWrapper, OnSave, OnSaveType } from './lib'
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
import { CasparCGMedia, ResourceAny, ResourceType } from '@shared/models'
import { usePromise } from '../../../../mobx/lib'
import { EditGDDData } from '../GDD/gddEdit'
import { GDDSchema } from 'graphics-data-definition'
import { PartialDeep } from 'type-fest'
import { isIndeterminate, inputValue, firstValue, anyAreTrue } from '../../../../lib/multipleEdit'
import { makePartialData } from '../GDD/lib'
import { observer } from 'mobx-react-lite'

export const EditTimelineObjCasparCGAny: React.FC<{
	objs: TimelineObjCasparCGAny[]
	resourceIds: string[]

	onSave: OnSave
}> = observer(function EditTimelineObjCasparCGAny({ objs, resourceIds, onSave: onSave0 }) {
	const allResources = store.resourcesStore.resources

	let settings: JSX.Element = <></>

	const onSave = onSave0 as OnSaveType<TimelineObjCasparCGAny>

	const [showAll, setShowAll] = React.useState(false)
	// const [showMixer, setShowMixer] = React.useState(false)

	const commonSettings: JSX.Element = (
		<>
			<div className="setting">
				<SelectEnum
					label="Type"
					fullWidth
					{...inputValue(objs, (obj) => obj.content.type, undefined)}
					options={TimelineContentTypeCasparCg}
					onChange={(newType: TimelineContentTypeCasparCg) => {
						let anyChange = false
						for (const obj of objs) {
							if (obj.content.type !== newType) {
								anyChange = true
								break
							}
						}
						if (!anyChange) return // no change

						// Create new content that is appropriate for the new CCG timelineObj type:
						switch (newType) {
							case TimelineContentTypeCasparCg.HTMLPAGE: {
								onSave({
									content: {
										deviceType: DeviceType.CASPARCG,
										type: newType,
										url: '',
									},
								})
								break
							}
							case TimelineContentTypeCasparCg.INPUT: {
								onSave({
									content: {
										deviceType: DeviceType.CASPARCG,
										type: newType,
										inputType: '',
										device: 0,
										deviceFormat: ChannelFormat.HD_1080P2500,
									},
								})
								break
							}
							case TimelineContentTypeCasparCg.IP: {
								onSave({
									content: {
										deviceType: DeviceType.CASPARCG,
										type: newType,
										uri: '',
									},
								})
								break
							}
							case TimelineContentTypeCasparCg.MEDIA: {
								onSave({
									content: {
										deviceType: DeviceType.CASPARCG,
										type: newType,
										file: '',
									},
								})
								break
							}
							case TimelineContentTypeCasparCg.RECORD: {
								onSave({
									content: {
										deviceType: DeviceType.CASPARCG,
										type: newType,
										file: '',
										encoderOptions: '',
									},
								})
								break
							}
							case TimelineContentTypeCasparCg.ROUTE: {
								onSave({
									content: {
										deviceType: DeviceType.CASPARCG,
										type: newType,
									},
								})
								break
							}
							case TimelineContentTypeCasparCg.TEMPLATE: {
								onSave({
									content: {
										deviceType: DeviceType.CASPARCG,
										type: newType,
										templateType: 'html',
										name: '',
										useStopCommand: false,
										data: {},
									},
								})
								break
							}
							default:
								assertNever(newType)
						}
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

	const getSettingsChannelLayout = (objs: (TimelineObjCasparCGAny & { content: { channelLayout?: string } })[]) => (
		<>
			{showAll || anyAreTrue(objs, (obj) => obj.content.channelLayout !== undefined) ? (
				<div className="setting">
					<TextInput
						label="channelLayout"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.channelLayout, undefined)}
						onChange={(v) => {
							onSave({ content: { channelLayout: v } })
						}}
						allowUndefined={true}
					/>
				</div>
			) : null}
		</>
	)

	const getSettingsVideoAudioFilters = (
		objs: (TimelineObjCasparCGAny & { content: { videoFilter?: string; audioFilter?: string } })[]
	) => (
		<>
			{showAll || anyAreTrue(objs, (obj) => !!obj.content.videoFilter) ? (
				<div className="setting">
					<TextInput
						label="VideoFilter"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.videoFilter, undefined)}
						onChange={(v) => {
							onSave({ content: { videoFilter: v } })
						}}
						allowUndefined={true}
					/>
				</div>
			) : null}
			{showAll || anyAreTrue(objs, (obj) => !!obj.content.audioFilter) ? (
				<div className="setting">
					<TextInput
						label="AudioFilter"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.audioFilter, undefined)}
						onChange={(v) => {
							onSave({ content: { audioFilter: v } })
						}}
						allowUndefined={true}
					/>
				</div>
			) : null}
		</>
	)

	const getSettingsTransitions = (
		objs: (TimelineObjCasparCGAny & { content: TimelineObjCCGProducerContentBase })[]
	) => {
		if (isIndeterminate(objs, (obj) => obj.content.transitions)) {
			return <>-- Different transitions --</>
		}
		const firstObj = objs[0]
		if (!firstObj) return null

		const transitions = firstObj.content.transitions || {}

		const inTransitions = getSettingsTransitionInner(
			transitions.inTransition || { type: Transition.CUT },
			'In',
			(transition) => {
				if (!transitions.inTransition) {
					transition = {
						type: Transition.CUT,
						...transition,
					}
				}
				onSave({ content: { transitions: { inTransition: transition } } })
			}
		)
		const outTransitions = getSettingsTransitionInner(
			transitions.outTransition || { type: Transition.CUT },
			'Out',
			(transition) => {
				if (!transitions.inTransition) {
					transition = {
						type: Transition.CUT,
						...transition,
					}
				}
				onSave({ content: { transitions: { outTransition: transition } } })
			}
		)

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
	const getSettingsTransitionInner = (
		transition: TimelineTransition,
		label: string,
		onSave: (transition: PartialDeep<TimelineTransition>) => void
	) => {
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
							const newTransition = deepClone(transition)
							newTransition.type = v
							// Convenience: add default values:
							if (newTransition.type === Transition.CUT) {
								newTransition.duration = undefined
							} else if (newTransition.type === Transition.MIX) {
								if (!newTransition.duration) newTransition.duration = 500
							} else if (
								newTransition.type === Transition.PUSH ||
								newTransition.type === Transition.SLIDE ||
								newTransition.type === Transition.WIPE
							) {
								if (!newTransition.duration) newTransition.duration = 500
								if (newTransition.easing === undefined) newTransition.easing = Ease.IN_OUT_CUBIC
							}

							onSave(newTransition)
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
								onSave({ duration: v })
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
								onSave({ easing: v })
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
								onSave({ direction: v })
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
								onSave({ maskFile: v })
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
								onSave({ overlayFile: v })
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
								onSave({ delay: v })
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
								onSave({ audioFadeStart: v })
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
								onSave({ audioFadeDuration: v })
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
								onSave({ customOptions: { updateInterval: v } } as any)
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
								onSave({ customOptions: { linearSpeed: v } } as any)
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
								onSave({ customOptions: { acceleration: v } } as any)
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
								onSave({ customOptions: { maxSpeed: v } } as any)
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
								onSave({ customOptions: { snapDistance: v } } as any)
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

	const getSettingsMixer = (objs: (TimelineObjCasparCGAny & { content: TimelineObjCCGProducerContentBase })[]) => {
		const mixers = objs.map((obj) => obj.content.mixer || {}) as MixerWithoutTransitionObject[]

		const mixSettings: JSX.Element[] = []

		const anyAnchor = anyAreTrue(mixers, (mixer) => mixer.anchor !== undefined)
		const anyBlend = anyAreTrue(mixers, (mixer) => mixer.blend !== undefined)
		const anyBrightness = anyAreTrue(mixers, (mixer) => mixer.brightness !== undefined)
		const anyChroma = anyAreTrue(mixers, (mixer) => mixer.chroma !== undefined)
		const anyClip = anyAreTrue(mixers, (mixer) => mixer.clip !== undefined)
		const anyContrast = anyAreTrue(mixers, (mixer) => mixer.contrast !== undefined)
		const anyCrop = anyAreTrue(mixers, (mixer) => mixer.crop !== undefined)
		const anyFill = anyAreTrue(mixers, (mixer) => mixer.fill !== undefined)
		const anyKeyer = anyAreTrue(mixers, (mixer) => mixer.keyer !== undefined)
		const anyLevels = anyAreTrue(mixers, (mixer) => mixer.levels !== undefined)
		const anyMasterVolume = anyAreTrue(mixers, (mixer) => mixer.mastervolume !== undefined)
		const anyOpacity = anyAreTrue(mixers, (mixer) => mixer.opacity !== undefined)
		const anyPerspective = anyAreTrue(mixers, (mixer) => mixer.perspective !== undefined)
		const anyRotation = anyAreTrue(mixers, (mixer) => mixer.rotation !== undefined)
		const anySaturation = anyAreTrue(mixers, (mixer) => mixer.saturation !== undefined)
		const anyStraightAlpha = anyAreTrue(mixers, (mixer) => mixer.straightAlpha !== undefined)
		const anyVolume = anyAreTrue(mixers, (mixer) => mixer.volume !== undefined)

		if (showAll || anyAnchor) {
			const anchor: {
				x: number
				y: number
			} = deepClone(firstValue(mixers, (mixer) => mixer.anchor) ?? { x: 0, y: 0 })

			mixSettings.push(
				<div className="settings-group" key="anchor">
					<div className="label">
						Anchor
						{anyAnchor && (
							<Btn
								className="size-small"
								onClick={() => {
									onSave({ content: { mixer: { anchor: undefined } } })
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
							{...inputValue(mixers, (mixer) => mixer.anchor?.x, 0)}
							onChange={(v) => {
								anchor.x = v
								onSave({ content: { mixer: { anchor: anchor } } })
							}}
							allowUndefined={false}
							percentage={true}
							endAdornment={
								<AnalogInputOverridePicker objs={objs} path="mixer.anchor.x" onSave={onSave0} />
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="anchor y"
							fullWidth
							{...inputValue(mixers, (mixer) => mixer.anchor?.y, 0)}
							onChange={(v) => {
								anchor.y = v
								onSave({ content: { mixer: { anchor: anchor } } })
							}}
							allowUndefined={false}
							percentage={true}
							endAdornment={
								<AnalogInputOverridePicker objs={objs} path="mixer.anchor.y" onSave={onSave0} />
							}
						/>
					</div>
				</div>
			)
		}
		if (showAll || anyBlend) {
			mixSettings.push(
				<div className="settings-group" key="blend">
					<div className="label">
						Blend
						{anyBlend && (
							<Btn
								className="size-small"
								onClick={() => {
									onSave({ content: { mixer: { blend: undefined } } })
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
							{...inputValue(mixers, (mixer) => mixer.blend, undefined)}
							onChange={(v) => {
								onSave({ content: { mixer: { blend: v } } })
							}}
							allowUndefined={false}
							options={BlendMode}
							defaultValue={BlendMode.NORMAL}
						/>
					</div>
				</div>
			)
		}
		if (showAll || anyBrightness) {
			mixSettings.push(
				<div className="settings-group" key="brightness">
					<div className="label">
						Brightness
						{anyBrightness && (
							<Btn
								className="size-small"
								onClick={() => {
									onSave({ content: { mixer: { brightness: undefined } } })
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
							{...inputValue(mixers, (mixer) => mixer.brightness, 1)}
							onChange={(v) => {
								onSave({ content: { mixer: { brightness: v } } })
							}}
							caps={[0, 1]}
							percentage={true}
							allowUndefined={false}
							defaultValue={1}
							endAdornment={
								<AnalogInputOverridePicker objs={objs} path="mixer.brightness" onSave={onSave0} />
							}
						/>
					</div>
				</div>
			)
		}
		if (showAll || anyChroma) {
			const chroma: {
				keyer: Chroma
				threshold: number
				softness: number
				spill: number
			} = deepClone(
				firstValue(mixers, (mixer) => mixer.chroma) ?? {
					keyer: Chroma.NONE,
					threshold: 0,
					softness: 0,
					spill: 0,
				}
			)
			mixSettings.push(
				<div className="settings-group" key="chroma">
					<div className="label">
						Chroma
						{anyChroma && (
							<Btn
								className="size-small"
								onClick={() => {
									onSave({ content: { mixer: { chroma: undefined } } })
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
							{...inputValue(mixers, (mixer) => mixer.chroma?.keyer, Chroma.NONE)}
							onChange={(v) => {
								chroma.keyer = v
								onSave({ content: { mixer: { chroma } } })
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
							{...inputValue(mixers, (mixer) => mixer.chroma?.threshold, 0)}
							onChange={(v) => {
								chroma.threshold = v
								onSave({ content: { mixer: { chroma } } })
							}}
							allowUndefined={false}
							percentage={true}
							endAdornment={
								<AnalogInputOverridePicker objs={objs} path="mixer.chroma.threshold" onSave={onSave0} />
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="Softness"
							fullWidth
							{...inputValue(mixers, (mixer) => mixer.chroma?.softness, 0)}
							onChange={(v) => {
								chroma.softness = v
								onSave({ content: { mixer: { chroma } } })
							}}
							allowUndefined={false}
							percentage={true}
							endAdornment={
								<AnalogInputOverridePicker objs={objs} path="mixer.chroma.softness" onSave={onSave0} />
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="Spill"
							fullWidth
							{...inputValue(mixers, (mixer) => mixer.chroma?.spill, 0)}
							onChange={(v) => {
								chroma.spill = v
								onSave({ content: { mixer: { chroma } } })
							}}
							allowUndefined={false}
							percentage={true}
							endAdornment={
								<AnalogInputOverridePicker objs={objs} path="mixer.chroma.spill" onSave={onSave0} />
							}
						/>
					</div>
				</div>
			)
		}
		if (showAll || anyClip) {
			const clip: {
				x: number
				y: number
				width: number
				height: number
			} = deepClone(
				firstValue(mixers, (mixer) => mixer.clip) ?? {
					x: 0,
					y: 0,
					width: 1,
					height: 1,
				}
			)
			mixSettings.push(
				<div className="settings-group" key="clip">
					<div className="label">
						Mixer clip
						{anyClip && (
							<Btn
								className="size-small"
								onClick={() => {
									onSave({ content: { mixer: { clip: undefined } } })
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
							{...inputValue(mixers, (mixer) => mixer.clip?.x, 0)}
							onChange={(v) => {
								clip.x = v
								onSave({ content: { mixer: { clip } } })
							}}
							allowUndefined={false}
							percentage={true}
							caps={[0, 1]}
							endAdornment={
								<AnalogInputOverridePicker objs={objs} path="mixer.clip.x" onSave={onSave0} />
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="Clip y"
							fullWidth
							{...inputValue(mixers, (mixer) => mixer.clip?.y, 0)}
							onChange={(v) => {
								clip.y = v
								onSave({ content: { mixer: { clip } } })
							}}
							allowUndefined={false}
							percentage={true}
							caps={[0, 1]}
							endAdornment={
								<AnalogInputOverridePicker objs={objs} path="mixer.clip.y" onSave={onSave0} />
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="Clip width"
							fullWidth
							{...inputValue(mixers, (mixer) => mixer.clip?.width, 1)}
							onChange={(v) => {
								clip.width = v
								onSave({ content: { mixer: { clip } } })
							}}
							allowUndefined={false}
							percentage={true}
							caps={[0, 1]}
							defaultValue={1}
							endAdornment={
								<AnalogInputOverridePicker objs={objs} path="mixer.clip.width" onSave={onSave0} />
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="Clip height"
							fullWidth
							{...inputValue(mixers, (mixer) => mixer.clip?.height, 1)}
							onChange={(v) => {
								clip.height = v
								onSave({ content: { mixer: { clip } } })
							}}
							allowUndefined={false}
							percentage={true}
							caps={[0, 1]}
							defaultValue={1}
							endAdornment={
								<AnalogInputOverridePicker objs={objs} path="mixer.clip.height" onSave={onSave0} />
							}
						/>
					</div>
				</div>
			)
		}
		if (showAll || anyContrast) {
			mixSettings.push(
				<div className="settings-group" key="contrast">
					<div className="label">
						Contrast
						{anyContrast && (
							<Btn
								className="size-small"
								onClick={() => {
									onSave({ content: { mixer: { contrast: undefined } } })
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
							{...inputValue(mixers, (mixer) => mixer.contrast, 1)}
							onChange={(v) => {
								onSave({ content: { mixer: { contrast: v } } })
							}}
							caps={[0, 1]}
							percentage={true}
							allowUndefined={false}
							defaultValue={1}
							endAdornment={
								<AnalogInputOverridePicker objs={objs} path="mixer.contrast" onSave={onSave0} />
							}
						/>
					</div>
				</div>
			)
		}
		if (showAll || anyCrop) {
			const crop: {
				left: number
				top: number
				right: number
				bottom: number
			} = deepClone(
				firstValue(mixers, (mixer) => mixer.crop) ?? {
					left: 0,
					top: 0,
					right: 1,
					bottom: 1,
				}
			)
			mixSettings.push(
				<div className="settings-group" key="crop">
					<div className="label">
						Mixer crop
						{anyCrop && (
							<Btn
								className="size-small"
								onClick={() => {
									onSave({ content: { mixer: { crop: undefined } } })
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
							{...inputValue(mixers, (mixer) => mixer.crop?.left, 0)}
							onChange={(v) => {
								crop.left = v
								onSave({ content: { mixer: { crop } } })
							}}
							allowUndefined={false}
							percentage={true}
							caps={[0, 1]}
							defaultValue={0}
							endAdornment={
								<AnalogInputOverridePicker objs={objs} path="mixer.crop.left" onSave={onSave0} />
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="Crop top"
							fullWidth
							{...inputValue(mixers, (mixer) => mixer.crop?.top, 0)}
							onChange={(v) => {
								crop.top = v
								onSave({ content: { mixer: { crop } } })
							}}
							allowUndefined={false}
							percentage={true}
							caps={[0, 1]}
							defaultValue={0}
							endAdornment={
								<AnalogInputOverridePicker objs={objs} path="mixer.crop.top" onSave={onSave0} />
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="crop right"
							fullWidth
							{...inputValue(mixers, (mixer) => mixer.crop?.right, 1)}
							onChange={(v) => {
								crop.right = v
								onSave({ content: { mixer: { crop } } })
							}}
							allowUndefined={false}
							percentage={true}
							caps={[0, 1]}
							defaultValue={1}
							endAdornment={
								<AnalogInputOverridePicker objs={objs} path="mixer.crop.right" onSave={onSave0} />
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="crop bottom"
							fullWidth
							{...inputValue(mixers, (mixer) => mixer.crop?.bottom, 1)}
							onChange={(v) => {
								crop.bottom = v
								onSave({ content: { mixer: { crop } } })
							}}
							allowUndefined={false}
							percentage={true}
							caps={[0, 1]}
							defaultValue={1}
							endAdornment={
								<AnalogInputOverridePicker objs={objs} path="mixer.crop.bottom" onSave={onSave0} />
							}
						/>
					</div>
				</div>
			)
		}
		if (showAll || anyFill) {
			const fill: {
				x: number
				y: number
				xScale: number
				yScale: number
			} = deepClone(
				firstValue(mixers, (mixer) => mixer.fill) ?? {
					x: 0,
					y: 0,
					xScale: 1,
					yScale: 1,
				}
			)
			mixSettings.push(
				<div className="settings-group" key="fill">
					<div className="label">
						Mixer Fill
						{anyFill && (
							<Btn
								className="size-small"
								onClick={() => {
									onSave({ content: { mixer: { fill: undefined } } })
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
							{...inputValue(mixers, (mixer) => mixer.fill?.x, 0)}
							onChange={(v) => {
								fill.x = v
								onSave({ content: { mixer: { fill } } })
							}}
							allowUndefined={false}
							percentage={true}
							endAdornment={
								<AnalogInputOverridePicker objs={objs} path="mixer.fill.x" onSave={onSave0} />
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="Fill y"
							fullWidth
							{...inputValue(mixers, (mixer) => mixer.fill?.y, 0)}
							onChange={(v) => {
								fill.y = v
								onSave({ content: { mixer: { fill } } })
							}}
							allowUndefined={false}
							percentage={true}
							endAdornment={
								<AnalogInputOverridePicker objs={objs} path="mixer.fill.y" onSave={onSave0} />
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="Fill x-scale"
							fullWidth
							{...inputValue(mixers, (mixer) => mixer.fill?.xScale, 1)}
							onChange={(v) => {
								fill.xScale = v
								onSave({ content: { mixer: { fill } } })
							}}
							allowUndefined={false}
							percentage={true}
							defaultValue={1}
							endAdornment={
								<AnalogInputOverridePicker objs={objs} path="mixer.fill.xScale" onSave={onSave0} />
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="Fill Y-Scale"
							fullWidth
							{...inputValue(mixers, (mixer) => mixer.fill?.yScale, 1)}
							onChange={(v) => {
								fill.yScale = v
								onSave({ content: { mixer: { fill } } })
							}}
							allowUndefined={false}
							percentage={true}
							defaultValue={1}
							endAdornment={
								<AnalogInputOverridePicker objs={objs} path="mixer.fill.yScale" onSave={onSave0} />
							}
						/>
					</div>
				</div>
			)
		}
		if (showAll || anyKeyer) {
			mixSettings.push(
				<div className="settings-group" key="keyer">
					<div className="label">
						Keyer
						{anyKeyer && (
							<Btn
								className="size-small"
								onClick={() => {
									onSave({ content: { mixer: { keyer: undefined } } })
								}}
							>
								<HiOutlineX />
							</Btn>
						)}
					</div>
					<div className="setting">
						<BooleanInput
							label="Keyer"
							{...inputValue(mixers, (mixer) => mixer.keyer, undefined)}
							onChange={(v) => {
								onSave({ content: { mixer: { keyer: v } } })
							}}
						/>
					</div>
				</div>
			)
		}
		if (showAll || anyLevels) {
			const levels: {
				minInput: number
				maxInput: number
				gamma: number
				minOutput: number
				maxOutput: number
			} = deepClone(
				firstValue(mixers, (mixer) => mixer.levels) ?? {
					minInput: 0,
					maxInput: 1,
					gamma: 1,
					minOutput: 0,
					maxOutput: 1,
				}
			)
			mixSettings.push(
				<div className="settings-group" key="levels">
					<div className="label">
						Mixer levels
						{anyLevels && (
							<Btn
								className="size-small"
								onClick={() => {
									onSave({ content: { mixer: { levels: undefined } } })
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
							{...inputValue(mixers, (mixer) => mixer.levels?.minInput, 0)}
							onChange={(v) => {
								levels.minInput = v
								onSave({ content: { mixer: { levels } } })
							}}
							allowUndefined={false}
							percentage={true}
							defaultValue={0}
							caps={[0, 1]}
							endAdornment={
								<AnalogInputOverridePicker objs={objs} path="mixer.levels.minInput" onSave={onSave0} />
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="levels maxInput"
							fullWidth
							{...inputValue(mixers, (mixer) => mixer.levels?.maxInput, 1)}
							onChange={(v) => {
								levels.maxInput = v
								onSave({ content: { mixer: { levels } } })
							}}
							allowUndefined={false}
							percentage={true}
							defaultValue={1}
							caps={[0, 1]}
							endAdornment={
								<AnalogInputOverridePicker objs={objs} path="mixer.levels.maxInput" onSave={onSave0} />
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="levels gamma"
							fullWidth
							{...inputValue(mixers, (mixer) => mixer.levels?.gamma, 1)}
							onChange={(v) => {
								levels.gamma = v
								onSave({ content: { mixer: { levels } } })
							}}
							allowUndefined={false}
							percentage={true}
							defaultValue={1}
							endAdornment={
								<AnalogInputOverridePicker objs={objs} path="mixer.levels.gamma" onSave={onSave0} />
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="levels minOutput"
							fullWidth
							{...inputValue(mixers, (mixer) => mixer.levels?.minOutput, 0)}
							onChange={(v) => {
								levels.minOutput = v
								onSave({ content: { mixer: { levels } } })
							}}
							allowUndefined={false}
							percentage={true}
							defaultValue={0}
							caps={[0, 1]}
							endAdornment={
								<AnalogInputOverridePicker objs={objs} path="mixer.levels.minOutput" onSave={onSave0} />
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="levels maxOutput"
							fullWidth
							{...inputValue(mixers, (mixer) => mixer.levels?.maxOutput, 1)}
							onChange={(v) => {
								levels.maxOutput = v
								onSave({ content: { mixer: { levels } } })
							}}
							allowUndefined={false}
							percentage={true}
							defaultValue={1}
							caps={[0, 1]}
							endAdornment={
								<AnalogInputOverridePicker objs={objs} path="mixer.levels.maxOutput" onSave={onSave0} />
							}
						/>
					</div>
				</div>
			)
		}
		if (showAll || anyMasterVolume) {
			mixSettings.push(
				<div className="settings-group" key="mastervolume">
					<div className="label">
						Master Volume
						{anyMasterVolume && (
							<Btn
								className="size-small"
								onClick={() => {
									onSave({ content: { mixer: { mastervolume: undefined } } })
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
							{...inputValue(mixers, (mixer) => mixer.mastervolume, 1)}
							onChange={(v) => {
								onSave({ content: { mixer: { mastervolume: v } } })
							}}
							percentage={true}
							allowUndefined={false}
							defaultValue={1}
							endAdornment={
								<AnalogInputOverridePicker objs={objs} path="mixer.mastervolume" onSave={onSave0} />
							}
						/>
					</div>
				</div>
			)
		}
		if (showAll || anyOpacity) {
			mixSettings.push(
				<div className="settings-group" key="opacity">
					<div className="label">
						Opacity
						{anyOpacity && (
							<Btn
								className="size-small"
								onClick={() => {
									onSave({ content: { mixer: { opacity: undefined } } })
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
							{...inputValue(mixers, (mixer) => mixer.opacity, 1)}
							onChange={(v) => {
								onSave({ content: { mixer: { opacity: v } } })
							}}
							percentage={true}
							allowUndefined={false}
							caps={[0, 1]}
							endAdornment={
								<AnalogInputOverridePicker objs={objs} path="mixer.opacity" onSave={onSave0} />
							}
						/>
					</div>
				</div>
			)
		}
		if (showAll || anyPerspective) {
			const perspective: {
				topLeftX: number
				topLeftY: number
				topRightX: number
				topRightY: number
				bottomRightX: number
				bottomRightY: number
				bottomLeftX: number
				bottomLeftY: number
			} = deepClone(
				firstValue(mixers, (mixer) => mixer.perspective) ?? {
					topLeftX: 0,
					topLeftY: 0,
					topRightX: 1,
					topRightY: 0,
					bottomRightX: 1,
					bottomRightY: 1,
					bottomLeftX: 0,
					bottomLeftY: 1,
				}
			)
			mixSettings.push(
				<div className="settings-group" key="perspective">
					<div className="label">
						Mixer perspective
						{anyPerspective && (
							<Btn
								className="size-small"
								onClick={() => {
									onSave({ content: { mixer: { perspective: undefined } } })
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
							{...inputValue(mixers, (mixer) => mixer.perspective?.topLeftX, 0)}
							onChange={(v) => {
								perspective.topLeftX = v
								onSave({ content: { mixer: { perspective } } })
							}}
							allowUndefined={false}
							percentage={true}
							defaultValue={0}
							endAdornment={
								<AnalogInputOverridePicker
									objs={objs}
									path="mixer.perspective.topLeftX"
									onSave={onSave0}
								/>
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="topLeftY"
							fullWidth
							{...inputValue(mixers, (mixer) => mixer.perspective?.topLeftY, 0)}
							onChange={(v) => {
								perspective.topLeftY = v
								onSave({ content: { mixer: { perspective } } })
							}}
							allowUndefined={false}
							percentage={true}
							defaultValue={0}
							endAdornment={
								<AnalogInputOverridePicker
									objs={objs}
									path="mixer.perspective.topLeftY"
									onSave={onSave0}
								/>
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="topRightX"
							fullWidth
							{...inputValue(mixers, (mixer) => mixer.perspective?.topRightX, 1)}
							onChange={(v) => {
								perspective.topRightX = v
								onSave({ content: { mixer: { perspective } } })
							}}
							allowUndefined={false}
							percentage={true}
							defaultValue={1}
							endAdornment={
								<AnalogInputOverridePicker
									objs={objs}
									path="mixer.perspective.topRightX"
									onSave={onSave0}
								/>
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="topRightY"
							fullWidth
							{...inputValue(mixers, (mixer) => mixer.perspective?.topRightY, 0)}
							onChange={(v) => {
								perspective.topRightY = v
								onSave({ content: { mixer: { perspective } } })
							}}
							allowUndefined={false}
							percentage={true}
							defaultValue={0}
							endAdornment={
								<AnalogInputOverridePicker
									objs={objs}
									path="mixer.perspective.topRightY"
									onSave={onSave0}
								/>
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="bottomRightX"
							fullWidth
							{...inputValue(mixers, (mixer) => mixer.perspective?.bottomRightX, 1)}
							onChange={(v) => {
								perspective.bottomRightX = v
								onSave({ content: { mixer: { perspective } } })
							}}
							allowUndefined={false}
							percentage={true}
							defaultValue={1}
							endAdornment={
								<AnalogInputOverridePicker
									objs={objs}
									path="mixer.perspective.bottomRightX"
									onSave={onSave0}
								/>
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="bottomRightY"
							fullWidth
							{...inputValue(mixers, (mixer) => mixer.perspective?.bottomRightY, 1)}
							onChange={(v) => {
								perspective.bottomRightY = v
								onSave({ content: { mixer: { perspective } } })
							}}
							allowUndefined={false}
							percentage={true}
							defaultValue={1}
							endAdornment={
								<AnalogInputOverridePicker
									objs={objs}
									path="mixer.perspective.bottomRightY"
									onSave={onSave0}
								/>
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="bottomLeftX"
							fullWidth
							{...inputValue(mixers, (mixer) => mixer.perspective?.bottomLeftX, 0)}
							onChange={(v) => {
								perspective.bottomLeftX = v
								onSave({ content: { mixer: { perspective } } })
							}}
							allowUndefined={false}
							percentage={true}
							defaultValue={0}
							endAdornment={
								<AnalogInputOverridePicker
									objs={objs}
									path="mixer.perspective.bottomLeftX"
									onSave={onSave0}
								/>
							}
						/>
					</div>
					<div className="setting">
						<FloatInput
							label="bottomLeftY"
							fullWidth
							{...inputValue(mixers, (mixer) => mixer.perspective?.bottomLeftY, 1)}
							onChange={(v) => {
								perspective.bottomLeftY = v
								onSave({ content: { mixer: { perspective } } })
							}}
							allowUndefined={false}
							percentage={true}
							defaultValue={1}
							endAdornment={
								<AnalogInputOverridePicker
									objs={objs}
									path="mixer.perspective.bottomLeftY"
									onSave={onSave0}
								/>
							}
						/>
					</div>
				</div>
			)
		}
		if (showAll || anyRotation) {
			mixSettings.push(
				<div className="settings-group" key="rotation">
					<div className="label">
						Rotation
						{anyRotation && (
							<Btn
								className="size-small"
								onClick={() => {
									onSave({ content: { mixer: { rotation: undefined } } })
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
							{...inputValue(mixers, (mixer) => mixer.rotation, 0)}
							onChange={(v) => {
								onSave({ content: { mixer: { rotation: v } } })
							}}
							allowUndefined={false}
							defaultValue={0}
							endAdornment={
								<AnalogInputOverridePicker objs={objs} path="mixer.rotation" onSave={onSave0} />
							}
						/>
					</div>
				</div>
			)
		}
		if (showAll || anySaturation) {
			mixSettings.push(
				<div className="settings-group" key="saturation">
					<div className="label">
						Saturation
						{anySaturation && (
							<Btn
								className="size-small"
								onClick={() => {
									onSave({ content: { mixer: { saturation: undefined } } })
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
							{...inputValue(mixers, (mixer) => mixer.saturation, 1)}
							onChange={(v) => {
								onSave({ content: { mixer: { saturation: v } } })
							}}
							allowUndefined={false}
							percentage={true}
							defaultValue={1}
							caps={[0, 1]}
							endAdornment={
								<AnalogInputOverridePicker objs={objs} path="mixer.saturation" onSave={onSave0} />
							}
						/>
					</div>
				</div>
			)
		}
		if (showAll || anyStraightAlpha) {
			mixSettings.push(
				<div className="settings-group" key="straightAlpha">
					<div className="label">
						Straight Alpha
						{anyStraightAlpha && (
							<Btn
								className="size-small"
								onClick={() => {
									onSave({ content: { mixer: { straightAlpha: undefined } } })
								}}
							>
								<HiOutlineX />
							</Btn>
						)}
					</div>
					<div className="setting">
						<BooleanInput
							label="Straight Alpha"
							{...inputValue(mixers, (mixer) => mixer.straightAlpha, undefined)}
							onChange={(v) => {
								onSave({ content: { mixer: { straightAlpha: v } } })
							}}
						/>
					</div>
				</div>
			)
		}
		if (showAll || anyVolume) {
			mixSettings.push(
				<div className="settings-group" key="volume">
					<div className="label">
						Volume
						{anyVolume && (
							<Btn
								className="size-small"
								onClick={() => {
									onSave({ content: { mixer: { volume: undefined } } })
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
							{...inputValue(mixers, (mixer) => mixer.volume, 1)}
							onChange={(v) => {
								onSave({ content: { mixer: { volume: v } } })
							}}
							allowUndefined={false}
							percentage={true}
							defaultValue={1}
							endAdornment={
								<AnalogInputOverridePicker objs={objs} path="mixer.volume" onSave={onSave0} />
							}
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

	const objs0 = objs

	const contentType = firstValue(objs, (obj) => obj.content.type)
	if (!contentType) return null

	if (contentType === TimelineContentTypeCasparCg.MEDIA) {
		const objs = objs0 as TimelineObjCCGMedia[]
		const firstObj = objs[0]
		if (!firstObj) return null

		let mediaResourceForFirstObj: CasparCGMedia | null = null
		if (objs.length === 1) {
			for (const resource of Object.values(allResources)) {
				if (
					resource.resourceType === ResourceType.CASPARCG_MEDIA &&
					resource.displayName.toLowerCase() === firstObj.content.file.toLowerCase()
				) {
					mediaResourceForFirstObj = resource
					break
				}
			}
		}

		settings = (
			<>
				<div className="setting">
					<TextInput
						label="Filename"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.file, '')}
						onChange={(v) => {
							onSave({ content: { file: v } })
						}}
						allowUndefined={false}
					/>
				</div>
				{mediaResourceForFirstObj ? (
					<img
						style={{ width: '100%' }}
						src={mediaResourceForFirstObj.thumbnail}
						alt={mediaResourceForFirstObj.name}
					/>
				) : null}
				<div className="setting">
					<BooleanInput
						label="Looping content"
						{...inputValue(objs, (obj) => obj.content.loop, undefined)}
						onChange={(v) => {
							onSave({ content: { loop: v } })
						}}
					/>
				</div>

				{showAll ||
				anyAreTrue(objs, (obj) => obj.content.seek !== undefined) ||
				anyAreTrue(objs, (obj) => obj.content.inPoint !== undefined) ||
				anyAreTrue(objs, (obj) => obj.content.length !== undefined) ? (
					<>
						<div className="setting">
							<DurationInput
								label="Seek"
								fullWidth
								{...inputValue(objs, (obj) => obj.content.seek, undefined)}
								onChange={(v) => {
									onSave({ content: { seek: v } })
								}}
								allowUndefined={true}
							/>
						</div>
						<div className="setting">
							<DurationInput
								label="In Point (ie loop start point)"
								fullWidth
								{...inputValue(objs, (obj) => obj.content.inPoint, undefined)}
								onChange={(v) => {
									onSave({ content: { inPoint: v } })
								}}
								allowUndefined={true}
							/>
						</div>
						<div className="setting">
							<DurationInput
								label="Length (ie point of freeze/loop)"
								fullWidth
								{...inputValue(objs, (obj) => obj.content.length, undefined)}
								onChange={(v) => {
									onSave({ content: { length: v } })
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
						{...inputValue(objs, (obj) => obj.content.noStarttime, undefined)}
						onChange={(v) => {
							onSave({ content: { noStarttime: v } })
						}}
					/>
				</div> */}
				{getSettingsChannelLayout(objs)}
				{getSettingsVideoAudioFilters(objs)}
				{getSettingsMixer(objs)}
				{getSettingsTransitions(objs)}

				{showAllButton}
			</>
		)
	} else if (contentType === TimelineContentTypeCasparCg.IP) {
		const objs = objs0 as TimelineObjCCGIP[]
		const firstObj = objs[0]
		if (!firstObj) return null
		settings = (
			<>
				<div className="setting">
					<TextInput
						label="URI"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.uri, '')}
						onChange={(v) => {
							onSave({ content: { uri: v } })
						}}
						allowUndefined={false}
					/>
				</div>
				{getSettingsChannelLayout(objs)}
				{getSettingsVideoAudioFilters(objs)}
				{getSettingsTransitions(objs)}

				{showAllButton}
			</>
		)
	} else if (contentType === TimelineContentTypeCasparCg.INPUT) {
		const objs = objs0 as TimelineObjCCGInput[]
		const firstObj = objs[0]
		if (!firstObj) return null
		settings = (
			<>
				<div className="setting">
					<TextInput
						label='Input Type (eg "decklink")'
						fullWidth
						{...inputValue(objs, (obj) => obj.content.inputType, '')}
						onChange={(v) => {
							onSave({ content: { inputType: v } })
						}}
						allowUndefined={false}
					/>
				</div>
				<div className="setting">
					<IntInput
						label="Device Number"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.device, 0)}
						onChange={(v) => {
							onSave({ content: { device: v } })
						}}
						allowUndefined={false}
						caps={[0, 99]}
					/>
				</div>
				<div className="setting">
					<SelectEnum
						label="Device Format"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.deviceFormat, undefined)}
						options={ChannelFormat}
						onChange={(v) => {
							onSave({ content: { deviceFormat: v } })
						}}
					/>
				</div>
				<div className="setting">
					<TextInput
						label="Filter"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.filter, undefined)}
						onChange={(v) => {
							onSave({ content: { filter: v } })
						}}
						allowUndefined={true}
					/>
				</div>

				{getSettingsChannelLayout(objs)}
				{getSettingsVideoAudioFilters(objs)}
				{getSettingsTransitions(objs)}

				{showAllButton}
			</>
		)
	} else if (contentType === TimelineContentTypeCasparCg.TEMPLATE) {
		const objs = objs0 as TimelineObjCCGTemplate[]
		const firstObj = objs[0]
		if (!firstObj) return null
		settings = (
			<>
				<div className="setting">
					<SelectEnum
						label="Template Type"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.templateType, undefined)}
						options={{ html: 'HTML', flash: 'Flash' }}
						onChange={(v) => {
							onSave({ content: { templateType: v } })
						}}
						defaultValue={'html'}
					/>
				</div>
				<div className="setting">
					<TextInput
						label="Name"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.name, '')}
						onChange={(v) => {
							onSave({ content: { name: v } })
						}}
						allowUndefined={false}
					/>
				</div>
				<div className="setting">
					<BooleanInput
						label="Send stop() on stop"
						{...inputValue(objs, (obj) => obj.content.useStopCommand, undefined)}
						onChange={(v) => {
							onSave({ content: { useStopCommand: v } })
						}}
					/>
				</div>

				<CasparEditTemplateData objs={objs} resourceIds={resourceIds} onSave={onSave0} />

				{/* {showAllButton} */}
			</>
		)
	} else if (contentType === TimelineContentTypeCasparCg.HTMLPAGE) {
		const objs = objs0 as TimelineObjCCGHTMLPage[]
		const firstObj = objs[0]
		if (!firstObj) return null
		settings = (
			<>
				<div className="setting">
					<TextInput
						label="URL"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.url, '')}
						onChange={(v) => {
							onSave({ content: { url: v } })
						}}
						allowUndefined={false}
					/>
				</div>
			</>
		)
	} else if (contentType === TimelineContentTypeCasparCg.ROUTE) {
		const objs = objs0 as (TimelineObjCCGRoute & { content: { __routeMappedLayer?: boolean } })[]
		const firstObj = objs[0]
		if (!firstObj) return null

		settings = (
			<>
				<div className="setting">
					<TextInput
						label="mappedLayer"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.mappedLayer, undefined)}
						onChange={(v) => {
							onSave({ content: { mappedLayer: v } })
						}}
						allowUndefined={true}
					/>
				</div>

				{isIndeterminate(objs, (obj) => obj.content.mappedLayer) ? (
					<>-- Different values -- </>
				) : !firstObj.content.mappedLayer ? (
					<>
						<div className="setting">
							<IntInput
								label="Channel"
								fullWidth
								{...inputValue(objs, (obj) => obj.content.channel, undefined)}
								onChange={(v) => {
									onSave({ content: { channel: v } })
								}}
								allowUndefined={true}
								caps={[0, 999]}
							/>
						</div>
						<div className="setting">
							<IntInput
								label="Layer"
								fullWidth
								{...inputValue(objs, (obj) => obj.content.layer, undefined)}
								onChange={(v) => {
									onSave({ content: { layer: v } })
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
						{...inputValue(objs, (obj) => obj.content.mode, undefined)}
						options={{
							BACKGROUND: 'BACKGROUND',
							NEXT: 'NEXT',
						}}
						onChange={(v) => {
							onSave({ content: { mode: v } })
						}}
						allowUndefined={true}
					/>
				</div>
				<div className="setting">
					<DurationInput
						label="Delay"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.delay, undefined)}
						onChange={(v) => {
							onSave({ content: { delay: v } })
						}}
						allowUndefined={true}
					/>
				</div>

				{getSettingsChannelLayout(objs)}
				{getSettingsVideoAudioFilters(objs)}
				{getSettingsTransitions(objs)}
				{showAllButton}
			</>
		)
	} else if (contentType === TimelineContentTypeCasparCg.RECORD) {
		const objs = objs0 as TimelineObjCCGRecord[]
		const firstObj = objs[0]
		if (!firstObj) return null

		settings = (
			<>
				<div className="setting">
					<TextInput
						label="File name"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.file, '')}
						onChange={(v) => {
							onSave({ content: { file: v } })
						}}
						allowUndefined={false}
					/>
				</div>
				<div className="setting">
					<TextInput
						label="Encoder Options"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.encoderOptions, '')}
						onChange={(v) => {
							onSave({ content: { encoderOptions: v } })
						}}
						allowUndefined={false}
					/>
				</div>
			</>
		)
	} else {
		assertNever(contentType)
	}

	return (
		<EditWrapper objs={objs} onSave={onSave0}>
			{commonSettings}
			{settings}
		</EditWrapper>
	)
})

const CasparEditTemplateData: React.FC<{
	objs: TimelineObjCCGTemplate[]
	resourceIds: string[]
	onSave: OnSave
}> = ({ objs, resourceIds, onSave }) => {
	const initializedGDDValidator = usePromise(() =>
		store.gddValidatorStore.initializeGDDSchemaValidator().then(() => true)
	)

	const resources: ResourceAny[] = []
	for (const resourceId of resourceIds) {
		const resource = computed(() => store.resourcesStore.getResource(resourceId)).get()
		if (resource) resources.push(resource)
	}

	const gddEdit = initializedGDDValidator ? prepareGDDEdit(resources) : undefined

	if (gddEdit) {
		return <CasparEditTemplateGDDData objs={objs} onSave={onSave} gddEdit={gddEdit} />
	} else {
		// Not GDD
		return <CasparEditTemplatePlainData objs={objs} onSave={onSave} />
	}
}
interface GDDEdit {
	errorMessage: string | null
	schema: GDDSchema
	validationResult: string | null
	gddIsIndeterminate: boolean
}
function prepareGDDEdit(resources: ResourceAny[]): GDDEdit | undefined {
	let errorMessage: string | null = null
	const gdds: {
		validationResult: string | null
		schema: GDDSchema
	}[] = []
	let gddIsIndeterminate = false

	if (resources.length) {
		for (const resource of resources) {
			if (resource.resourceType === ResourceType.CASPARCG_TEMPLATE) {
				if (resource.errorMessage) errorMessage = resource.errorMessage

				if (resource.gdd) {
					const gdd = {
						schema: resource.gdd,
						validationResult: null,
					}
					gdds.push(gdd)
				}
			}
		}

		if (gdds.length) {
			gddIsIndeterminate = isIndeterminate(gdds, (gdd) => gdd.schema)

			if (!gddIsIndeterminate) {
				store.gddValidatorStore.initializeGDDSchemaValidator().catch((window as any).handleError)
				const gddValidator = computed(() => store.gddValidatorStore.gddValidator).get()
				if (gddValidator) {
					for (const gdd of gdds) {
						gdd.validationResult = gddValidator(gdd.schema)
					}
				}
			}
		}
	}

	if (gdds.length > 0) {
		const gdd = gdds[0]
		return {
			errorMessage,
			gddIsIndeterminate,
			schema: gdd.schema,
			validationResult: gdd.validationResult,
		}
	}
}
const CasparEditTemplateGDDData: React.FC<{
	gddEdit: GDDEdit
	objs: TimelineObjCCGTemplate[]
	onSave: OnSave
}> = ({ gddEdit, objs, onSave }) => {
	const [editIndeterminateData, setEditIndeterminateData] = useState(false)

	const contentDataIsIndeterminate = isIndeterminate(objs, (obj) => obj.content.data)
	const contentData = firstValue(objs, (obj) => obj.content.data) || {}

	if (gddEdit.gddIsIndeterminate) {
		return (
			<>
				<div className="setting">-- Different GDD schemas --</div>
			</>
		)
	}

	if (gddEdit.errorMessage) {
		return (
			<>
				<div className="setting">
					Error in template:
					<div className="markable">{gddEdit.errorMessage}</div>
				</div>
			</>
		)
	}
	if (!editIndeterminateData && contentDataIsIndeterminate) {
		return (
			<>
				<div className="setting">
					-- Different data --
					<div>
						<Btn
							className="size-small"
							onClick={() => {
								setEditIndeterminateData(true)
							}}
						>
							Edit anyway
						</Btn>
					</div>
				</div>
			</>
		)
	}

	if (gddEdit.validationResult) {
		return (
			<>
				<div className="setting">
					Error in Schema:
					<div className="markable">{gddEdit.validationResult}</div>
				</div>
			</>
		)
	}
	return (
		<>
			<div className="setting">
				{
					<EditGDDData
						objs={objs}
						data={contentData}
						schema={gddEdit.schema}
						onSaveObj={onSave}
						onSaveContentData={(data: any) => {
							// Make a diff, so that we don't overwrite the whole data object.
							// This is useful when editing multiple objects and we only want to change _one_
							// of the fields.
							const diff = makePartialData(data, contentData)
							onSave({
								content: {
									data: {
										__gdd: 1,
										...diff,
									},
								},
							})
						}}
					/>
				}
			</div>
		</>
	)
}

const CasparEditTemplatePlainData: React.FC<{
	objs: TimelineObjCCGTemplate[]
	onSave: OnSave
}> = ({ objs, onSave }) => {
	const [editIndeterminateData, setEditIndeterminateData] = useState(false)

	const firstObj = objs[0]
	let parsed: { [id: string]: string } = {}
	if (!firstObj) return null
	try {
		if (typeof firstObj.content.data === 'string') {
			parsed = JSON.parse(firstObj.content.data)
		} else {
			parsed = firstObj.content.data
		}
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error(err)
	}

	const handleUpdateValue = (key: string, newValue: string) => {
		const modifier: any = {}
		modifier[key] = newValue
		onSave({ content: { data: modifier } })
	}
	const handleUpdateKey = (oldKey: string, newKey: string) => {
		if (newKey !== oldKey) {
			const modifier: any = {}
			modifier[newKey] = parsed[oldKey]
			modifier[oldKey] = undefined

			onSave({ content: { data: modifier } })
		}
	}

	const handleAddNew = () => {
		const modifier: any = {}

		// Find next free key:
		for (let i = 0; i < 100; i++) {
			const key = `f${i}`
			if (parsed[key] === undefined) {
				modifier[key] = ''
				break
			}
		}
		onSave({ content: { data: modifier } })
	}

	const handleDelete = (key: string) => {
		const modifier: any = {}
		modifier[key] = undefined
		onSave({ content: { data: modifier } })
	}

	if (!editIndeterminateData && isIndeterminate(objs, (obj) => obj.content.data)) {
		return (
			<>
				<div className="setting">
					-- Different data --
					<div>
						<Btn
							className="size-small"
							onClick={() => {
								setEditIndeterminateData(true)
							}}
						>
							Edit anyway
						</Btn>
					</div>
				</div>
			</>
		)
	}

	const dataEntries: Array<{ key: string; value: any }> = []
	for (const [key, value] of Object.entries(parsed)) {
		if (key === '__gdd') continue
		dataEntries.push({ key, value })
	}

	return (
		<>
			{parsed.__gdd && (
				<div className="setting">
					Data seems to be GDD-data, but no GDD schema was found. Try to reload the resources and ensure that
					the resource shows up in the library.
				</div>
			)}
			<div className="setting">
				<BooleanInput
					label="Classic CasparCG XML Data"
					{...inputValue(objs, (obj) => (obj.content as any).sendDataAsXML, undefined)}
					onChange={(v) => {
						onSave({ content: { sendDataAsXML: v } })
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
						{dataEntries.map(({ key, value }) => {
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

// This is a copy of the Mixer interface from TSR, but with "| TransitionObject" removed from all of the properties.
export interface MixerWithoutTransitionObject {
	inTransition?: CasparCGTransition
	changeTransition?: CasparCGTransition
	outTransition?: CasparCGTransition
	anchor?: {
		x: number
		y: number
	}
	blend?: BlendMode
	brightness?: number
	chroma?: {
		keyer: Chroma
		threshold: number
		softness: number
		spill: number
	}
	clip?: {
		x: number
		y: number
		width: number
		height: number
	}
	contrast?: number
	crop?: {
		left: number
		top: number
		right: number
		bottom: number
	}
	fill?: {
		x: number
		y: number
		xScale: number
		yScale: number
	}
	keyer?: boolean
	levels?: {
		minInput: number
		maxInput: number
		gamma: number
		minOutput: number
		maxOutput: number
	}
	mastervolume?: number
	opacity?: number
	perspective?: {
		topLeftX: number
		topLeftY: number
		topRightX: number
		topRightY: number
		bottomRightX: number
		bottomRightY: number
		bottomLeftX: number
		bottomLeftY: number
	}
	rotation?: number
	saturation?: number
	straightAlpha?: boolean
	volume?: number
	bundleWithCommands?: number
}

// Ensure that MixerWithoutTransitionObject and Mixer are compatible:
function assertTypeMixer(_m: Required<Mixer>): void {
	// nothing
}
export function testMixerWithoutTransitionObject(m: Required<MixerWithoutTransitionObject>): void {
	assertTypeMixer(m)
}
