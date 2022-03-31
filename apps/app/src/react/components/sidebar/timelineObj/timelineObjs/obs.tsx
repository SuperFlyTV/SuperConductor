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
import { BooleanInput } from '../../../inputs/BooleanInput'
import { TextInput } from '../../../inputs/TextInput'
import { EditWrapper, NOT_IMPLEMENTED_SETTINGS, OnSave } from './lib'

export const EditTimelineObjOBSAny: React.FC<{ obj: TimelineObjOBSAny; onSave: OnSave }> = ({ obj, onSave }) => {
	let settings: JSX.Element = <></>

	const obj0 = obj
	if (obj.content.type === TimelineContentTypeOBS.CURRENT_SCENE) {
		const obj = obj0 as TimelineObjOBSCurrentScene
		settings = (
			<>
				<div className="setting">
					<TextInput
						label="Scene Name"
						fullWidth
						currentValue={obj.content.sceneName}
						onChange={(v) => {
							obj.content.sceneName = v
							onSave(obj)
						}}
						allowUndefined={false}
					/>
				</div>
			</>
		)
	} else if (obj.content.type === TimelineContentTypeOBS.CURRENT_TRANSITION) {
		const obj = obj0 as TimelineObjOBSCurrentTransition
		settings = (
			<>
				<div className="setting">
					<TextInput
						label="Transition Name"
						fullWidth
						currentValue={obj.content.transitionName}
						onChange={(v) => {
							obj.content.transitionName = v
							onSave(obj)
						}}
						allowUndefined={false}
					/>
				</div>
			</>
		)
	} else if (obj.content.type === TimelineContentTypeOBS.RECORDING) {
		const obj = obj0 as TimelineObjOBSRecording
		settings = (
			<>
				<div className="setting">
					<BooleanInput
						label="Recording On"
						currentValue={obj.content.on}
						onChange={(v) => {
							obj.content.on = v
							onSave(obj)
						}}
					/>
				</div>
			</>
		)
	} else if (obj.content.type === TimelineContentTypeOBS.STREAMING) {
		const obj = obj0 as TimelineObjOBSStreaming
		settings = (
			<>
				<div className="setting">
					<BooleanInput
						label="Stream On"
						currentValue={obj.content.on}
						onChange={(v) => {
							obj.content.on = v
							onSave(obj)
						}}
					/>
				</div>
			</>
		)
	} else if (obj.content.type === TimelineContentTypeOBS.MUTE) {
		const obj = obj0 as TimelineObjOBSMute
		settings = (
			<>
				<div className="setting">
					<BooleanInput
						label="Mute On"
						currentValue={obj.content.mute}
						onChange={(v) => {
							obj.content.mute = v
							onSave(obj)
						}}
					/>
				</div>
			</>
		)
	} else if (obj.content.type === TimelineContentTypeOBS.SCENE_ITEM_RENDER) {
		const obj = obj0 as TimelineObjOBSSceneItemRender
		settings = (
			<>
				<div className="setting">
					<BooleanInput
						label="Render On"
						currentValue={obj.content.on}
						onChange={(v) => {
							obj.content.on = v
							onSave(obj)
						}}
					/>
				</div>
			</>
		)
	} else if (obj.content.type === TimelineContentTypeOBS.SOURCE_SETTINGS) {
		const obj = obj0 as TimelineObjOBSSourceSettings
		settings = (
			<>
				<div className="setting">
					<TextField
						select
						margin="normal"
						fullWidth
						autoFocus
						label="Source Type"
						value={obj.content.sourceType}
						onChange={(event) => {
							obj.content.sourceType = event.target.value as any
							if (obj.content.sourceType === 'ffmpeg_source' && !obj.content.sourceSettings) {
								;(obj.content as any).sourceSettings = {}
							}
							onSave(obj)
						}}
					>
						<MenuItem value="ffmpeg_source">FFMpeg Source</MenuItem>
						<MenuItem value="dshow_input">DShow Input</MenuItem>
						<MenuItem value="browser_source">Browser Source</MenuItem>
						<MenuItem value="window_capture">Window Capture</MenuItem>
						<MenuItem value="image_source">Image Source</MenuItem>
					</TextField>
				</div>

				{obj.content.sourceType === 'ffmpeg_source' && (
					<>
						<div className="setting">
							<BooleanInput
								label="Close when inactive"
								currentValue={obj.content.sourceSettings.close_when_inactive}
								onChange={(v) => {
									if (!obj.content.sourceSettings) {
										return
									}
									obj.content.sourceSettings.close_when_inactive = v
									onSave(obj)
								}}
							/>
						</div>
						<div className="setting">
							<BooleanInput
								label="Hardware decode"
								currentValue={obj.content.sourceSettings.hw_decode}
								onChange={(v) => {
									if (!obj.content.sourceSettings) {
										return
									}
									obj.content.sourceSettings.hw_decode = v
									onSave(obj)
								}}
							/>
						</div>
						<div className="setting">
							<TextInput
								label="Input"
								fullWidth
								currentValue={obj.content.sourceSettings.input}
								onChange={(v) => {
									if (!obj.content.sourceSettings) {
										return
									}
									obj.content.sourceSettings.input = v
									onSave(obj)
								}}
								allowUndefined={true}
							/>
						</div>
						<div className="setting">
							<BooleanInput
								label="Is local file"
								currentValue={obj.content.sourceSettings.is_local_file}
								onChange={(v) => {
									if (!obj.content.sourceSettings) {
										return
									}
									obj.content.sourceSettings.is_local_file = v
									onSave(obj)
								}}
							/>
						</div>
						<div className="setting">
							<TextInput
								label="Local file"
								fullWidth
								currentValue={obj.content.sourceSettings.local_file}
								onChange={(v) => {
									if (!obj.content.sourceSettings) {
										return
									}
									obj.content.sourceSettings.local_file = v
									onSave(obj)
								}}
								allowUndefined={true}
							/>
						</div>
						<div className="setting">
							<BooleanInput
								label="Looping"
								currentValue={obj.content.sourceSettings.looping}
								onChange={(v) => {
									if (!obj.content.sourceSettings) {
										return
									}
									obj.content.sourceSettings.looping = v
									onSave(obj)
								}}
							/>
						</div>
					</>
				)}
			</>
		)
	} else {
		assertNever(obj.content)
		return NOT_IMPLEMENTED_SETTINGS
	}

	return (
		<EditWrapper obj={obj} onSave={onSave}>
			{settings}
		</EditWrapper>
	)
}
