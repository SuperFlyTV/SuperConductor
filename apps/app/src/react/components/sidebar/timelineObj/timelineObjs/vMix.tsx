import { Link, Typography } from '@mui/material'
import { assertNever } from '@shared/lib'
import React, { useState } from 'react'
import {
	TimelineContentTypeVMix,
	TimelineObjVMixAny,
	TimelineObjVMixAudio,
	TimelineObjVMixExternal,
	TimelineObjVMixFader,
	TimelineObjVMixFadeToBlack,
	TimelineObjVMixInput,
	TimelineObjVMixOutput,
	TimelineObjVMixOverlay,
	TimelineObjVMixPreview,
	TimelineObjVMixProgram,
	TimelineObjVMixRecording,
	TimelineObjVMixStreaming,
	VMixInputType,
	VMixTransform,
	VMixTransitionType,
} from 'timeline-state-resolver-types'
import { firstValue, isIndeterminate, inputValue, anyAreTrue, allAreTrue } from '../../../../lib/multipleEdit'
import { BooleanInput } from '../../../inputs/BooleanInput'
import { DurationInput } from '../../../inputs/DurationInput'
import { IntInput } from '../../../inputs/IntInput'
import { SelectEnum } from '../../../inputs/SelectEnum'
import { TextInput } from '../../../inputs/TextInput'
import { EditWrapper, NOT_IMPLEMENTED_SETTINGS, OnSave, OnSaveType } from './lib'

const DEFAULT_TRANSFORM: VMixTransform = {
	zoom: 1,
	panX: 0,
	panY: 0,
	alpha: 255,
}

const OVERLAYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

enum VMixOutputSourceType {
	Preview = 'Preview',
	Program = 'Program',
	MultiView = 'MultiView',
	Input = 'Input',
}

export const EditTimelineObjVMixAny: React.FC<{ objs: TimelineObjVMixAny[]; onSave: OnSave }> = ({
	objs,
	onSave: onSave0,
}) => {
	const [showAll, setShowAll] = useState(false)
	const onSave = onSave0 as OnSaveType<TimelineObjVMixAny>
	let settings: JSX.Element = NOT_IMPLEMENTED_SETTINGS

	const showAllButton = showAll ? (
		<Link href="#" onClick={() => setShowAll(false)}>
			Hide more settings
		</Link>
	) : (
		<Link href="#" onClick={() => setShowAll(true)}>
			Show more settings
		</Link>
	)

	const contentType = firstValue(objs, (obj) => obj.content.type)
	if (!contentType) return null

	if (isIndeterminate(objs, (obj) => obj.content.type)) {
		return <>-- Different types --</>
	}

	const objs0 = objs
	if (contentType === TimelineContentTypeVMix.AUDIO) {
		const objs = objs0 as TimelineObjVMixAudio[]
		const firstObj = objs[0]
		if (!firstObj) return null
		settings = (
			<>
				<div className="setting">
					<IntInput
						label="Volume (0 - 100)"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.volume, 0)}
						onChange={(v) => {
							if (firstObj.content.type !== TimelineContentTypeVMix.AUDIO) return
							onSave({ content: { volume: v } })
						}}
						allowUndefined={true}
					/>
				</div>

				<div className="setting">
					<IntInput
						label="Fade Duration (milliseconds)"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.fade, 0)}
						onChange={(v) => {
							if (firstObj.content.type !== TimelineContentTypeVMix.AUDIO) return
							onSave({ content: { fade: v } })
						}}
						allowUndefined={true}
					/>
				</div>

				<div className="setting">
					<IntInput
						label="Balance (-1 - 1)"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.balance, 0)}
						onChange={(v) => {
							if (firstObj.content.type !== TimelineContentTypeVMix.AUDIO) return
							onSave({ content: { balance: v } })
						}}
						allowUndefined={true}
					/>
				</div>

				<div className="setting">
					<BooleanInput
						label="Muted"
						{...inputValue(objs, (obj) => obj.content.muted, undefined)}
						onChange={(v) => {
							if (firstObj.content.type !== TimelineContentTypeVMix.AUDIO) return
							onSave({ content: { muted: v } })
						}}
					/>
				</div>

				<div className="setting">
					<TextInput
						label="Audio Buses (M,A,B,C,D,E,F,G)"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.audioBuses, '')}
						onChange={(v) => {
							if (firstObj.content.type !== TimelineContentTypeVMix.AUDIO) return
							onSave({ content: { audioBuses: v } })
						}}
						allowUndefined={true}
					/>
				</div>

				<div className="setting">
					<BooleanInput
						label="Audio Follow Video"
						{...inputValue(objs, (obj) => obj.content.audioAuto, undefined)}
						onChange={(v) => {
							if (firstObj.content.type !== TimelineContentTypeVMix.AUDIO) return
							onSave({ content: { audioAuto: v } })
						}}
					/>
				</div>
			</>
		)
	} else if (contentType === TimelineContentTypeVMix.EXTERNAL) {
		const objs = objs0 as TimelineObjVMixExternal[]
		const firstObj = objs[0]
		if (!firstObj) return null
		settings = (
			<>
				<div className="setting">
					<BooleanInput
						label="On"
						{...inputValue(objs, (obj) => obj.content.on, undefined)}
						onChange={(v) => {
							if (firstObj.content.type !== TimelineContentTypeVMix.EXTERNAL) return
							onSave({ content: { on: v } })
						}}
					/>
				</div>
			</>
		)
	} else if (contentType === TimelineContentTypeVMix.FADER) {
		const objs = objs0 as TimelineObjVMixFader[]
		const firstObj = objs[0]
		if (!firstObj) return null
		settings = (
			<>
				<div className="setting">
					<IntInput
						label="Position (0 - 255)"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.position, 0)}
						onChange={(v) => {
							if (firstObj.content.type !== TimelineContentTypeVMix.FADER) return
							onSave({ content: { position: v } })
						}}
						allowUndefined={false}
					/>
				</div>
			</>
		)
	} else if (contentType === TimelineContentTypeVMix.FADE_TO_BLACK) {
		const objs = objs0 as TimelineObjVMixFadeToBlack[]
		const firstObj = objs[0]
		if (!firstObj) return null
		settings = (
			<>
				<div className="setting">
					<BooleanInput
						label="On"
						{...inputValue(objs, (obj) => obj.content.on, undefined)}
						onChange={(v) => {
							if (firstObj.content.type !== TimelineContentTypeVMix.FADE_TO_BLACK) return
							onSave({ content: { on: v } })
						}}
					/>
				</div>
			</>
		)
	} else if (contentType === TimelineContentTypeVMix.INPUT) {
		const objs = objs0 as TimelineObjVMixInput[]
		const firstObj = objs[0]
		if (!firstObj) return null
		settings = (
			<>
				<div className="setting">
					<TextInput
						label="File Path"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.filePath + '', '')}
						onChange={(v) => {
							if (firstObj.content.type !== TimelineContentTypeVMix.INPUT) return
							onSave({ content: { filePath: v } })
						}}
						allowUndefined={true}
					/>
				</div>

				<div className="setting">
					<SelectEnum
						label="Input Type"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.inputType, undefined)}
						options={VMixInputType}
						onChange={(v) => {
							if (firstObj.content.type !== TimelineContentTypeVMix.INPUT) return
							onSave({ content: { inputType: v } })
						}}
						allowUndefined={true}
					/>
				</div>

				<div className="setting">
					<BooleanInput
						label="Playing"
						{...inputValue(objs, (obj) => obj.content.playing, undefined)}
						onChange={(v) => {
							if (firstObj.content.type !== TimelineContentTypeVMix.INPUT) return
							onSave({ content: { playing: v } })
						}}
					/>
				</div>

				<div className="setting">
					<IntInput
						label="Seek (milliseconds)"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.seek, 0)}
						onChange={(v) => {
							if (firstObj.content.type !== TimelineContentTypeVMix.INPUT) return
							onSave({ content: { seek: v } })
						}}
						allowUndefined={true}
					/>
				</div>

				<div className="setting">
					<BooleanInput
						label="Loop"
						{...inputValue(objs, (obj) => obj.content.loop, undefined)}
						onChange={(v) => {
							if (firstObj.content.type !== TimelineContentTypeVMix.INPUT) return
							onSave({ content: { loop: v } })
						}}
					/>
				</div>

				<div className="setting">
					<IntInput
						label="Scale (0 - 5)"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.transform?.zoom, 1)}
						onChange={(v) => {
							if (firstObj.content.type !== TimelineContentTypeVMix.INPUT) return
							if (anyAreTrue(objs, (obj) => !obj.content.transform)) {
								onSave({ content: { transform: { ...DEFAULT_TRANSFORM, zoom: v } } })
							} else {
								onSave({ content: { transform: { zoom: v } } })
							}
						}}
						allowUndefined={false}
					/>
				</div>

				<div className="setting">
					<IntInput
						label="Horizontal Pan (-2 - 2)"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.transform?.panX, 0)}
						onChange={(v) => {
							if (firstObj.content.type !== TimelineContentTypeVMix.INPUT) return
							if (anyAreTrue(objs, (obj) => !obj.content.transform)) {
								onSave({ content: { transform: { ...DEFAULT_TRANSFORM, panX: v } } })
							} else {
								onSave({ content: { transform: { panX: v } } })
							}
						}}
						allowUndefined={false}
					/>
				</div>

				<div className="setting">
					<IntInput
						label="Vertical Pan (-2 - 2)"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.transform?.panY, 0)}
						onChange={(v) => {
							if (firstObj.content.type !== TimelineContentTypeVMix.INPUT) return
							if (anyAreTrue(objs, (obj) => !obj.content.transform)) {
								onSave({ content: { transform: { ...DEFAULT_TRANSFORM, panY: v } } })
							} else {
								onSave({ content: { transform: { panY: v } } })
							}
						}}
						allowUndefined={false}
					/>
				</div>

				<div className="setting">
					<IntInput
						label="Alpha (0 - 255)"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.transform?.alpha, 255)}
						onChange={(v) => {
							if (firstObj.content.type !== TimelineContentTypeVMix.INPUT) return
							if (anyAreTrue(objs, (obj) => !obj.content.transform)) {
								onSave({ content: { transform: { ...DEFAULT_TRANSFORM, alpha: v } } })
							} else {
								onSave({ content: { transform: { alpha: v } } })
							}
						}}
						allowUndefined={false}
					/>
				</div>

				{showAll &&
					OVERLAYS.map((overlayIndex) => {
						if (firstObj.content.type !== TimelineContentTypeVMix.INPUT) return null
						return (
							<React.Fragment key={overlayIndex}>
								<Typography variant="body2">Overlay #{overlayIndex}</Typography>
								<div className="setting">
									<IntInput
										label="Input"
										fullWidth
										{...inputValue(
											objs,
											(obj) => parseInt(obj.content.overlays?.[overlayIndex] + '', 10) || 0,
											0
										)}
										onChange={(v) => {
											if (firstObj.content.type !== TimelineContentTypeVMix.INPUT) return
											onSave({ content: { overlays: { [overlayIndex]: v } } })
										}}
										allowUndefined={false}
									/>
								</div>
							</React.Fragment>
						)
					})}

				{showAllButton}
			</>
		)
	} else if (contentType === TimelineContentTypeVMix.OUTPUT) {
		const objs = objs0 as TimelineObjVMixOutput[]
		const firstObj = objs[0]
		if (!firstObj) return null
		settings = (
			<>
				<div className="setting">
					<SelectEnum
						label="Source"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.source, undefined)}
						options={VMixOutputSourceType}
						onChange={(v) => {
							if (firstObj.content.type !== TimelineContentTypeVMix.OUTPUT) return
							onSave({ content: { source: v } })
						}}
						allowUndefined={false}
					/>
				</div>

				<div className="setting">
					<IntInput
						label="Input"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.input as number, 0)}
						onChange={(v) => {
							if (firstObj.content.type !== TimelineContentTypeVMix.OUTPUT) return
							onSave({ content: { input: v } })
						}}
						allowUndefined={true}
					/>
				</div>
			</>
		)
	} else if (contentType === TimelineContentTypeVMix.OVERLAY) {
		const objs = objs0 as TimelineObjVMixOverlay[]
		const firstObj = objs[0]
		if (!firstObj) return null
		settings = (
			<>
				<div className="setting">
					<IntInput
						label="Input"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.input as number, 0)}
						onChange={(v) => {
							if (firstObj.content.type !== TimelineContentTypeVMix.OVERLAY) return
							onSave({ content: { input: v } })
						}}
						allowUndefined={false}
					/>
				</div>
			</>
		)
	} else if (contentType === TimelineContentTypeVMix.PREVIEW) {
		const objs = objs0 as TimelineObjVMixPreview[]
		const firstObj = objs[0]
		if (!firstObj) return null
		settings = (
			<>
				<div className="setting">
					<IntInput
						label="Input"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.input as number, 0)}
						onChange={(v) => {
							if (firstObj.content.type !== TimelineContentTypeVMix.PREVIEW) return
							onSave({ content: { input: v } })
						}}
						allowUndefined={false}
					/>
				</div>
			</>
		)
	} else if (contentType === TimelineContentTypeVMix.PROGRAM) {
		const objs = objs0 as TimelineObjVMixProgram[]
		const firstObj = objs[0]
		if (!firstObj) return null

		settings = (
			<>
				<div className="setting">
					<IntInput
						label="Input"
						fullWidth
						{...inputValue(
							objs,
							(obj) => (typeof obj.content.input === 'number' ? obj.content.input : 1),
							1
						)}
						onChange={(v) => {
							onSave({ content: { input: v } })
						}}
						allowUndefined={true}
					/>
				</div>

				<div className="setting">
					<TextInput
						label="Input Layer"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.inputLayer, '')}
						onChange={(v) => {
							onSave({ content: { inputLayer: v } })
						}}
						allowUndefined={true}
					/>
				</div>

				<div className="setting">
					<SelectEnum
						label="Transition Effect"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.transition?.effect, undefined)}
						options={VMixTransitionType}
						onChange={(v) => {
							if (allAreTrue(objs, (obj) => !!obj.content.transition)) {
								onSave({ content: { transition: { effect: v } } })
							} else {
								onSave({
									content: {
										transition: {
											effect: v,
											duration: 0,
										},
									},
								})
							}
						}}
					/>
				</div>

				<div className="setting">
					<DurationInput
						label="Transition Duration"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.transition?.duration, 0)}
						onChange={(v) => {
							if (allAreTrue(objs, (obj) => !!obj.content.transition)) {
								onSave({ content: { transition: { duration: v } } })
							} else {
								onSave({
									content: {
										transition: {
											effect: VMixTransitionType.Cut,
											duration: v,
										},
									},
								})
							}
						}}
						allowUndefined={false}
						allowNull={false}
						defaultValue={0}
					/>
				</div>
			</>
		)
	} else if (contentType === TimelineContentTypeVMix.RECORDING) {
		const objs = objs0 as TimelineObjVMixRecording[]
		const firstObj = objs[0]
		if (!firstObj) return null
		settings = (
			<>
				<div className="setting">
					<BooleanInput
						label="On"
						{...inputValue(objs, (obj) => obj.content.on, undefined)}
						onChange={(v) => {
							if (firstObj.content.type !== TimelineContentTypeVMix.RECORDING) return
							onSave({ content: { on: v } })
						}}
					/>
				</div>
			</>
		)
	} else if (contentType === TimelineContentTypeVMix.STREAMING) {
		const objs = objs0 as TimelineObjVMixStreaming[]
		const firstObj = objs[0]
		if (!firstObj) return null
		settings = (
			<>
				<div className="setting">
					<BooleanInput
						label="On"
						{...inputValue(objs, (obj) => obj.content.on, undefined)}
						onChange={(v) => {
							if (firstObj.content.type !== TimelineContentTypeVMix.STREAMING) return
							onSave({ content: { on: v } })
						}}
					/>
				</div>
			</>
		)
	} else {
		assertNever(contentType)
	}

	return (
		<EditWrapper objs={objs} onSave={onSave0}>
			{settings}
		</EditWrapper>
	)
}
