import { MenuItem, TextField } from '@mui/material'
import { assertNever } from '@shared/lib'
import React from 'react'
import {
	TimelineContentTypeOBS,
	TimelineObjOBSAny,
	TimelineObjOBSCurrentScene,
	TimelineObjOBSCurrentTransition,
	TimelineObjOBSMute,
	TimelineObjOBSRecording,
	TimelineObjOBSSceneItemRender,
	TimelineObjOBSSourceSettings,
	TimelineObjOBSStreaming,
} from 'timeline-state-resolver-types'
import { firstValue, inputValue, isIndeterminate } from '../../../../lib/multipleEdit'
import { BooleanInput } from '../../../inputs/BooleanInput'
import { TextInput } from '../../../inputs/TextInput'
import { EditWrapper, NOT_IMPLEMENTED_SETTINGS, OnSave, OnSaveType } from './lib'

export const EditTimelineObjOBSAny: React.FC<{ objs: TimelineObjOBSAny[]; onSave: OnSave }> = ({
	objs,
	onSave: onSave0,
}) => {
	const onSave = onSave0 as OnSaveType<TimelineObjOBSAny>
	let settings: JSX.Element = <></>

	const contentType = firstValue(objs, (obj) => obj.content.type)
	if (!contentType) return null

	const objs0 = objs
	if (contentType === TimelineContentTypeOBS.CURRENT_SCENE) {
		const objs = objs0 as TimelineObjOBSCurrentScene[]
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
		const objs = objs0 as TimelineObjOBSCurrentTransition[]
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
		const objs = objs0 as TimelineObjOBSRecording[]
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
		const objs = objs0 as TimelineObjOBSStreaming[]
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
	} else if (contentType === TimelineContentTypeOBS.MUTE) {
		const objs = objs0 as TimelineObjOBSMute[]
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
			</>
		)
	} else if (contentType === TimelineContentTypeOBS.SCENE_ITEM_RENDER) {
		const objs = objs0 as TimelineObjOBSSceneItemRender[]
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
	} else if (contentType === TimelineContentTypeOBS.SOURCE_SETTINGS) {
		const objs = objs0 as TimelineObjOBSSourceSettings[]
		const firstObj = objs[0]
		if (!firstObj) return null

		settings = (
			<>
				<div className="setting">
					<TextField
						select
						margin="normal"
						fullWidth
						autoFocus
						label="Source Type"
						{...inputValue(objs, (obj) => obj.content.sourceType, '')}
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

				{isIndeterminate(objs, (obj) => obj.content.sourceType) ? (
					<>-- Different values -- </>
				) : (
					firstObj.content.sourceType === 'ffmpeg_source' && (
						<>
							<div className="setting">
								<BooleanInput
									label="Close when inactive"
									{...inputValue(
										objs,
										(obj) => (obj.content.sourceSettings as any).close_when_inactive,
										''
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
									{...inputValue(objs, (obj) => (obj.content.sourceSettings as any).hw_decode, '')}
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
									{...inputValue(objs, (obj) => (obj.content.sourceSettings as any).input, '')}
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
									{...inputValue(
										objs,
										(obj) => (obj.content.sourceSettings as any).is_local_file,
										''
									)}
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
									{...inputValue(objs, (obj) => (obj.content.sourceSettings as any).local_file, '')}
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
									{...inputValue(objs, (obj) => (obj.content.sourceSettings as any).looping, '')}
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
