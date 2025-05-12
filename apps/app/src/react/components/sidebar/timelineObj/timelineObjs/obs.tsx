import { MenuItem, TextField } from '@mui/material'
import { assertNever } from '@shared/lib'
import React from 'react'
import {
	TSRTimelineObj,
	TimelineContentOBSAny,
	TimelineContentOBSCurrentScene,
	TimelineContentOBSCurrentTransition,
	TimelineContentOBSInputAudio,
	TimelineContentOBSRecording,
	TimelineContentOBSSceneItem,
	TimelineContentOBSInputSettings,
	TimelineContentOBSStreaming,
	TimelineContentTypeOBS,
	TimelineContentOBSInputMedia,
} from 'timeline-state-resolver-types'
import { firstValue, inputValue } from '../../../../lib/multipleEdit.js'
import { BooleanInput } from '../../../inputs/BooleanInput.js'
import { TextInput } from '../../../inputs/TextInput.js'
import { EditWrapper, NOT_IMPLEMENTED_SETTINGS, OnSave, OnSaveType } from './lib.js'
import { FloatInput } from '../../../inputs/FloatInput.js'

export const EditTimelineObjOBSAny: React.FC<{ objs: TSRTimelineObj<TimelineContentOBSAny>[]; onSave: OnSave }> = ({
	objs,
	onSave: onSave0,
}) => {
	const onSave = onSave0 as OnSaveType<TSRTimelineObj<TimelineContentOBSAny>>
	let settings: JSX.Element = <></>

	const contentType = firstValue(objs, (obj) => obj.content.type)
	if (!contentType) return null

	const objs0 = objs
	if (contentType === TimelineContentTypeOBS.CURRENT_SCENE) {
		const objs = objs0 as TSRTimelineObj<TimelineContentOBSCurrentScene>[]
		settings = (
			<>
				<div className="setting">
					<TextInput
						label="Scene Name"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.sceneName, '')}
						onChange={(v) => {
							onSave({ content: { sceneName: v } })
						}}
						allowUndefined={false}
					/>
				</div>
			</>
		)
	} else if (contentType === TimelineContentTypeOBS.CURRENT_TRANSITION) {
		const objs = objs0 as TSRTimelineObj<TimelineContentOBSCurrentTransition>[]
		settings = (
			<>
				<div className="setting">
					<TextInput
						label="Transition Name"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.transitionName, '')}
						onChange={(v) => {
							onSave({ content: { transitionName: v } })
						}}
						allowUndefined={false}
					/>
				</div>
			</>
		)
	} else if (contentType === TimelineContentTypeOBS.RECORDING) {
		const objs = objs0 as TSRTimelineObj<TimelineContentOBSRecording>[]
		settings = (
			<>
				<div className="setting">
					<BooleanInput
						label="Recording On"
						{...inputValue(objs, (obj) => obj.content.on, undefined)}
						onChange={(v) => {
							onSave({ content: { on: v } })
						}}
					/>
				</div>
			</>
		)
	} else if (contentType === TimelineContentTypeOBS.STREAMING) {
		const objs = objs0 as TSRTimelineObj<TimelineContentOBSStreaming>[]
		settings = (
			<>
				<div className="setting">
					<BooleanInput
						label="Stream On"
						{...inputValue(objs, (obj) => obj.content.on, undefined)}
						onChange={(v) => {
							onSave({ content: { on: v } })
						}}
					/>
				</div>
			</>
		)
	} else if (contentType === TimelineContentTypeOBS.INPUT_AUDIO) {
		const objs = objs0 as TSRTimelineObj<TimelineContentOBSInputAudio>[]
		settings = (
			<>
				<div className="setting">
					<BooleanInput
						label="Mute On"
						{...inputValue(objs, (obj) => obj.content.mute, undefined)}
						onChange={(v) => {
							onSave({ content: { mute: v } })
						}}
					/>
				</div>

				<div className="form-control">
					<FloatInput
						label="Volume"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.volume, undefined)}
						onChange={(v) => {
							onSave({ content: { volume: v } })
						}}
						allowUndefined={true}
						caps={[-100, 25]}
					/>
				</div>
			</>
		)
	} else if (contentType === TimelineContentTypeOBS.INPUT_MEDIA) {
		const objs = objs0 as TSRTimelineObj<TimelineContentOBSInputMedia>[]

		const currentState = inputValue(objs, (obj) => obj.content.state, '')

		settings = (
			<>
				<div className="setting">
					<TextField
						select
						margin="normal"
						fullWidth
						autoFocus
						label="State"
						value={currentState.currentValue}
						onChange={(event) => {
							const state = event.target.value as any
							onSave({ content: { state } })
						}}
					>
						<MenuItem value="">Not set</MenuItem>
						<MenuItem value="playing">Playing</MenuItem>
						<MenuItem value="paused">Paused</MenuItem>
						<MenuItem value="stopped">Stopped</MenuItem>
					</TextField>
				</div>
			</>
		)
		// Future: add seek prop
	} else if (contentType === TimelineContentTypeOBS.SCENE_ITEM) {
		const objs = objs0 as TSRTimelineObj<TimelineContentOBSSceneItem>[]
		settings = (
			<>
				<div className="setting">
					<BooleanInput
						label="Render On"
						{...inputValue(objs, (obj) => obj.content.on, undefined)}
						onChange={(v) => {
							onSave({ content: { on: v } })
						}}
					/>
				</div>
			</>
		)
		// Future: add transform props
	} else if (contentType === TimelineContentTypeOBS.INPUT_SETTINGS) {
		const objs = objs0 as TSRTimelineObj<TimelineContentOBSInputSettings>[]
		const firstObj = objs[0]
		if (!firstObj) return null

		const currentSourceType = inputValue(objs, (obj) => obj.content.sourceType, '')

		settings = (
			<>
				<div className="setting">
					<TextField
						select
						margin="normal"
						fullWidth
						autoFocus
						label="Source Type"
						value={currentSourceType.currentValue}
						onChange={(event) => {
							const sourceType = event.target.value as any
							if (firstObj.content.sourceType === 'ffmpeg_source' && !firstObj.content.sourceSettings) {
								onSave({ content: { sourceType, sourceSettings: {} } })
							} else {
								onSave({ content: { sourceType } })
							}
						}}
					>
						<MenuItem value="ffmpeg_source">FFMpeg Source</MenuItem>
						<MenuItem value="dshow_input">DShow Input</MenuItem>
						<MenuItem value="browser_source">Browser Source</MenuItem>
						<MenuItem value="window_capture">Window Capture</MenuItem>
						<MenuItem value="image_source">Image Source</MenuItem>
					</TextField>
				</div>

				{currentSourceType.indeterminate ? (
					<>-- Different values -- </>
				) : (
					firstObj.content.sourceType === 'ffmpeg_source' && (
						<>
							<div className="setting">
								<BooleanInput
									label="Close when inactive"
									{...inputValue(
										objs,
										(obj) => obj.content.sourceSettings?.close_when_inactive,
										false
									)}
									onChange={(v) => {
										if (!firstObj.content.sourceSettings) return
										onSave({ content: { sourceSettings: { close_when_inactive: v } } })
									}}
								/>
							</div>
							<div className="setting">
								<BooleanInput
									label="Hardware decode"
									{...inputValue(objs, (obj) => obj.content.sourceSettings?.hw_decode, false)}
									onChange={(v) => {
										if (!firstObj.content.sourceSettings) return
										onSave({ content: { sourceSettings: { hw_decode: v } } })
									}}
								/>
							</div>
							<div className="setting">
								<TextInput
									label="Input"
									fullWidth
									{...inputValue(objs, (obj) => obj.content.sourceSettings?.input, '')}
									onChange={(v) => {
										if (!firstObj.content.sourceSettings) return
										onSave({ content: { sourceSettings: { input: v } } })
									}}
									allowUndefined={true}
								/>
							</div>
							<div className="setting">
								<BooleanInput
									label="Is local file"
									{...inputValue(objs, (obj) => obj.content.sourceSettings?.is_local_file, false)}
									onChange={(v) => {
										if (!firstObj.content.sourceSettings) return
										onSave({ content: { sourceSettings: { is_local_file: v } } })
									}}
								/>
							</div>
							<div className="setting">
								<TextInput
									label="Local file"
									fullWidth
									{...inputValue(objs, (obj) => obj.content.sourceSettings?.local_file, '')}
									onChange={(v) => {
										if (!firstObj.content.sourceSettings) return
										onSave({ content: { sourceSettings: { local_file: v } } })
									}}
									allowUndefined={true}
								/>
							</div>
							<div className="setting">
								<BooleanInput
									label="Looping content"
									{...inputValue(objs, (obj) => obj.content.sourceSettings?.looping, false)}
									onChange={(v) => {
										if (!firstObj.content.sourceSettings) return
										onSave({ content: { sourceSettings: { looping: v } } })
									}}
								/>
							</div>
						</>
					)
				)}
			</>
		)
	} else {
		assertNever(contentType)
		return NOT_IMPLEMENTED_SETTINGS
	}

	return (
		<EditWrapper objs={objs} onSave={onSave0}>
			{settings}
		</EditWrapper>
	)
}
