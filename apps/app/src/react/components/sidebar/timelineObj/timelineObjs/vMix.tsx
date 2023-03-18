import { Link, Typography } from '@mui/material'
import { assertNever } from '@shared/lib'
import React, { useState } from 'react'
import {
	TimelineContentTypeVMix,
	TimelineObjVMixAny,
	TimelineObjVMixProgram,
	VMixInputType,
	VMixTransform,
	VMixTransitionType,
} from 'timeline-state-resolver-types'
import { BooleanInput } from '../../../inputs/BooleanInput'
import { DurationInput } from '../../../inputs/DurationInput'
import { IntInput } from '../../../inputs/IntInput'
import { SelectEnum } from '../../../inputs/SelectEnum'
import { TextInput } from '../../../inputs/TextInput'
import { EditTimelineObjProps, EditWrapper, NOT_IMPLEMENTED_SETTINGS } from './lib'

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

export const EditTimelineObjVMixAny: React.FC<EditTimelineObjProps<TimelineObjVMixAny>> = (props) => {
	const { obj, onSave } = props
	const [showAll, setShowAll] = useState(false)
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

	const obj0 = obj
	if (obj.content.type === TimelineContentTypeVMix.AUDIO) {
		settings = (
			<>
				<div className="setting">
					<IntInput
						label="Volume (0 - 100)"
						fullWidth
						currentValue={obj.content.volume}
						onChange={(v) => {
							if (obj.content.type !== TimelineContentTypeVMix.AUDIO) return
							obj.content.volume = v
							onSave(obj)
						}}
						allowUndefined={true}
					/>
				</div>

				<div className="setting">
					<IntInput
						label="Fade Duration (milliseconds)"
						fullWidth
						currentValue={obj.content.fade}
						onChange={(v) => {
							if (obj.content.type !== TimelineContentTypeVMix.AUDIO) return
							obj.content.fade = v
							onSave(obj)
						}}
						allowUndefined={true}
					/>
				</div>

				<div className="setting">
					<IntInput
						label="Balance (-1 - 1)"
						fullWidth
						currentValue={obj.content.balance}
						onChange={(v) => {
							if (obj.content.type !== TimelineContentTypeVMix.AUDIO) return
							obj.content.balance = v
							onSave(obj)
						}}
						allowUndefined={true}
					/>
				</div>

				<div className="setting">
					<BooleanInput
						label="Muted"
						currentValue={obj.content.muted}
						onChange={(v) => {
							if (obj.content.type !== TimelineContentTypeVMix.AUDIO) return
							obj.content.muted = v
							onSave(obj)
						}}
					/>
				</div>

				<div className="setting">
					<TextInput
						label="Audio Buses (M,A,B,C,D,E,F,G)"
						fullWidth
						currentValue={obj.content.audioBuses}
						onChange={(v) => {
							if (obj.content.type !== TimelineContentTypeVMix.AUDIO) return
							obj.content.audioBuses = v
							onSave(obj)
						}}
						allowUndefined={true}
					/>
				</div>

				<div className="setting">
					<BooleanInput
						label="Audio Follow Video"
						currentValue={obj.content.audioAuto}
						onChange={(v) => {
							if (obj.content.type !== TimelineContentTypeVMix.AUDIO) return
							obj.content.audioAuto = v
							onSave(obj)
						}}
					/>
				</div>
			</>
		)
	} else if (obj.content.type === TimelineContentTypeVMix.EXTERNAL) {
		settings = (
			<>
				<div className="setting">
					<BooleanInput
						label="On"
						currentValue={obj.content.on}
						onChange={(v) => {
							if (obj.content.type !== TimelineContentTypeVMix.EXTERNAL) return
							obj.content.on = v
							onSave(obj)
						}}
					/>
				</div>
			</>
		)
	} else if (obj.content.type === TimelineContentTypeVMix.FADER) {
		settings = (
			<>
				<div className="setting">
					<IntInput
						label="Position (0 - 255)"
						fullWidth
						currentValue={obj.content.position}
						onChange={(v) => {
							if (obj.content.type !== TimelineContentTypeVMix.FADER) return
							obj.content.position = v
							onSave(obj)
						}}
						allowUndefined={false}
					/>
				</div>
			</>
		)
	} else if (obj.content.type === TimelineContentTypeVMix.FADE_TO_BLACK) {
		settings = (
			<>
				<div className="setting">
					<BooleanInput
						label="On"
						currentValue={obj.content.on}
						onChange={(v) => {
							if (obj.content.type !== TimelineContentTypeVMix.FADE_TO_BLACK) return
							obj.content.on = v
							onSave(obj)
						}}
					/>
				</div>
			</>
		)
	} else if (obj.content.type === TimelineContentTypeVMix.INPUT) {
		settings = (
			<>
				<div className="setting">
					<TextInput
						label="File Path"
						fullWidth
						currentValue={obj.content.filePath as string | undefined}
						onChange={(v) => {
							if (obj.content.type !== TimelineContentTypeVMix.INPUT) return
							obj.content.filePath = v
							onSave(obj)
						}}
						allowUndefined={true}
					/>
				</div>

				<div className="setting">
					<SelectEnum
						label="Input Type"
						fullWidth
						currentValue={obj.content.inputType}
						options={VMixInputType}
						onChange={(v) => {
							if (obj.content.type !== TimelineContentTypeVMix.INPUT) return
							obj.content.inputType = v
							onSave(obj)
						}}
						allowUndefined={true}
					/>
				</div>

				<div className="setting">
					<BooleanInput
						label="Playing"
						currentValue={obj.content.playing}
						onChange={(v) => {
							if (obj.content.type !== TimelineContentTypeVMix.INPUT) return
							obj.content.playing = v
							onSave(obj)
						}}
					/>
				</div>

				<div className="setting">
					<IntInput
						label="Seek (milliseconds)"
						fullWidth
						currentValue={obj.content.seek}
						onChange={(v) => {
							if (obj.content.type !== TimelineContentTypeVMix.INPUT) return
							obj.content.seek = v
							onSave(obj)
						}}
						allowUndefined={true}
					/>
				</div>

				<div className="setting">
					<BooleanInput
						label="Loop"
						currentValue={obj.content.loop}
						onChange={(v) => {
							if (obj.content.type !== TimelineContentTypeVMix.INPUT) return
							obj.content.loop = v
							onSave(obj)
						}}
					/>
				</div>

				<div className="setting">
					<IntInput
						label="Scale (0 - 5)"
						fullWidth
						currentValue={obj.content.transform?.zoom ?? 1}
						onChange={(v) => {
							if (obj.content.type !== TimelineContentTypeVMix.INPUT) return
							if (!obj.content.transform) obj.content.transform = DEFAULT_TRANSFORM
							obj.content.transform.zoom = v
							onSave(obj)
						}}
						allowUndefined={false}
					/>
				</div>

				<div className="setting">
					<IntInput
						label="Horizontal Pan (-2 - 2)"
						fullWidth
						currentValue={obj.content.transform?.panX ?? 0}
						onChange={(v) => {
							if (obj.content.type !== TimelineContentTypeVMix.INPUT) return
							if (!obj.content.transform) obj.content.transform = DEFAULT_TRANSFORM
							obj.content.transform.panX = v
							onSave(obj)
						}}
						allowUndefined={false}
					/>
				</div>

				<div className="setting">
					<IntInput
						label="Vertical Pan (-2 - 2)"
						fullWidth
						currentValue={obj.content.transform?.panY ?? 0}
						onChange={(v) => {
							if (obj.content.type !== TimelineContentTypeVMix.INPUT) return
							if (!obj.content.transform) obj.content.transform = DEFAULT_TRANSFORM
							obj.content.transform.panY = v
							onSave(obj)
						}}
						allowUndefined={false}
					/>
				</div>

				<div className="setting">
					<IntInput
						label="Alpha (0 - 255)"
						fullWidth
						currentValue={obj.content.transform?.alpha ?? 255}
						onChange={(v) => {
							if (obj.content.type !== TimelineContentTypeVMix.INPUT) return
							if (!obj.content.transform) obj.content.transform = DEFAULT_TRANSFORM
							obj.content.transform.alpha = v
							onSave(obj)
						}}
						allowUndefined={false}
					/>
				</div>

				{showAll &&
					OVERLAYS.map((overlayIndex) => {
						if (obj.content.type !== TimelineContentTypeVMix.INPUT) return null
						const overlayInput = obj.content.overlays ? obj.content.overlays[overlayIndex] : 0
						return (
							<React.Fragment key={overlayIndex}>
								<Typography variant="body2">Overlay #{overlayIndex}</Typography>
								<div className="setting">
									<IntInput
										label="Input"
										fullWidth
										currentValue={overlayInput as number}
										onChange={(v) => {
											if (obj.content.type !== TimelineContentTypeVMix.INPUT) return
											if (!obj.content.overlays) obj.content.overlays = {}
											obj.content.overlays[overlayIndex] = v
											onSave(obj)
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
	} else if (obj.content.type === TimelineContentTypeVMix.OUTPUT) {
		settings = (
			<>
				<div className="setting">
					<SelectEnum
						label="Source"
						fullWidth
						currentValue={obj.content.source}
						options={VMixOutputSourceType}
						onChange={(v) => {
							if (obj.content.type !== TimelineContentTypeVMix.OUTPUT) return
							obj.content.source = v
							onSave(obj)
						}}
						allowUndefined={false}
					/>
				</div>

				<div className="setting">
					<IntInput
						label="Input"
						fullWidth
						currentValue={obj.content.input as number}
						onChange={(v) => {
							if (obj.content.type !== TimelineContentTypeVMix.OUTPUT) return
							obj.content.input = v
							onSave(obj)
						}}
						allowUndefined={true}
					/>
				</div>
			</>
		)
	} else if (obj.content.type === TimelineContentTypeVMix.OVERLAY) {
		settings = (
			<>
				<div className="setting">
					<IntInput
						label="Input"
						fullWidth
						currentValue={obj.content.input as number}
						onChange={(v) => {
							if (obj.content.type !== TimelineContentTypeVMix.OVERLAY) return
							obj.content.input = v
							onSave(obj)
						}}
						allowUndefined={false}
					/>
				</div>
			</>
		)
	} else if (obj.content.type === TimelineContentTypeVMix.PREVIEW) {
		settings = (
			<>
				<div className="setting">
					<IntInput
						label="Input"
						fullWidth
						currentValue={obj.content.input as number}
						onChange={(v) => {
							if (obj.content.type !== TimelineContentTypeVMix.PREVIEW) return
							obj.content.input = v
							onSave(obj)
						}}
						allowUndefined={false}
					/>
				</div>
			</>
		)
	} else if (obj.content.type === TimelineContentTypeVMix.PROGRAM) {
		const obj = obj0 as TimelineObjVMixProgram

		let inputNumber = 1
		if (typeof obj.content.input === 'number') {
			inputNumber = obj.content.input
		}

		settings = (
			<>
				<div className="setting">
					<IntInput
						label="Input"
						fullWidth
						currentValue={inputNumber}
						onChange={(v) => {
							obj.content.input = v
							onSave(obj)
						}}
						allowUndefined={true}
					/>
				</div>

				<div className="setting">
					<TextInput
						label="Input Layer"
						fullWidth
						currentValue={obj.content.inputLayer}
						onChange={(v) => {
							obj.content.inputLayer = v
							onSave(obj)
						}}
						allowUndefined={true}
					/>
				</div>

				<div className="setting">
					<SelectEnum
						label="Transition Effect"
						fullWidth
						currentValue={obj.content.transition?.effect}
						options={VMixTransitionType}
						onChange={(v) => {
							if (obj.content.transition) {
								obj.content.transition.effect = v
							} else {
								obj.content.transition = {
									effect: v,
									duration: 0,
								}
							}
							onSave(obj)
						}}
					/>
				</div>

				<div className="setting">
					<DurationInput
						label="Transition Duration"
						fullWidth
						currentValue={obj.content.transition?.duration ?? 0}
						onChange={(v) => {
							if (obj.content.transition) {
								obj.content.transition.duration = v
							} else {
								obj.content.transition = {
									effect: VMixTransitionType.Cut,
									duration: v,
								}
							}
							onSave(obj)
						}}
						allowUndefined={false}
						allowNull={false}
						defaultValue={0}
					/>
				</div>
			</>
		)
	} else if (obj.content.type === TimelineContentTypeVMix.RECORDING) {
		settings = (
			<>
				<div className="setting">
					<BooleanInput
						label="On"
						currentValue={obj.content.on}
						onChange={(v) => {
							if (obj.content.type !== TimelineContentTypeVMix.RECORDING) return
							obj.content.on = v
							onSave(obj)
						}}
					/>
				</div>
			</>
		)
	} else if (obj.content.type === TimelineContentTypeVMix.STREAMING) {
		settings = (
			<>
				<div className="setting">
					<BooleanInput
						label="On"
						currentValue={obj.content.on}
						onChange={(v) => {
							if (obj.content.type !== TimelineContentTypeVMix.STREAMING) return
							obj.content.on = v
							onSave(obj)
						}}
					/>
				</div>
			</>
		)
	} else {
		assertNever(obj.content)
	}

	return <EditWrapper {...props}>{settings}</EditWrapper>
}
