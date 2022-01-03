import React from 'react'
import { assertNever } from '@/lib/lib'
import {
	ChannelFormat,
	TimelineContentTypeCasparCg,
	TimelineObjCasparCGAny,
	TimelineObjCCGHTMLPage,
	TimelineObjCCGInput,
	TimelineObjCCGIP,
	TimelineObjCCGMedia,
	TimelineObjCCGRecord,
	TimelineObjCCGRoute,
	TimelineObjCCGTemplate,
} from 'timeline-state-resolver-types'
import { EditWrapper, OnSave } from './lib'
import { BooleanInput } from '../input/boolean'
import { DurationInput } from '../input/duration'
import { SelectEnum } from '../input/enum'
import { IntInput } from '../input/int'
import { TextInput } from '../input/text'

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
				<label>Type</label>
				<SelectEnum
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
					<label>channelLayout</label>
					<TextInput
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
					<label>VideoFilter</label>
					<TextInput
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
					<label>AudioFilter</label>
					<TextInput
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

	const showAllButton = showAll ? (
		<a href="#" onClick={() => setShowAll(false)}>
			Hide more settings
		</a>
	) : (
		<a href="#" onClick={() => setShowAll(true)}>
			Show more settings
		</a>
	)

	const notImplementedSettings = (
		<div className="setting">
			<label>Not implemented</label>
			<div>
				<i>Support for this type of timeline object hasn't been implemented yet. Feel free to submit a pull request!</i>
				<div>
					<pre>{JSON.stringify(obj.content, undefined, 2)}</pre>
				</div>
			</div>
		</div>
	)

	const obj0 = obj

	if (obj.content.type === TimelineContentTypeCasparCg.MEDIA) {
		let obj = obj0 as TimelineObjCCGMedia
		settings = (
			<>
				<div className="setting">
					<label>Filename</label>
					<TextInput
						currentValue={obj.content.file}
						onChange={(v) => {
							obj.content.file = v
							onSave(obj)
						}}
						allowUndefined={false}
					/>
				</div>
				<div className="setting">
					<label>Looping</label>
					<BooleanInput
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
							<label>Seek</label>
							<DurationInput
								currentValue={obj.content.seek}
								onChange={(v) => {
									obj.content.seek = v
									onSave(obj)
								}}
								allowUndefined={true}
							/>
						</div>
						<div className="setting">
							<label>In Point (ie loop start point)</label>
							<DurationInput
								currentValue={obj.content.inPoint}
								onChange={(v) => {
									obj.content.inPoint = v
									onSave(obj)
								}}
								allowUndefined={true}
							/>
						</div>
						<div className="setting">
							<label>Length (ie point of freeze/loop)</label>
							<DurationInput
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

				{showAllButton}
			</>
		)
	} else if (obj.content.type === TimelineContentTypeCasparCg.IP) {
		const obj = obj0 as TimelineObjCCGIP
		settings = (
			<>
				<div className="setting">
					<label>URI</label>
					<TextInput
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

				{showAllButton}
			</>
		)
	} else if (obj.content.type === TimelineContentTypeCasparCg.INPUT) {
		const obj = obj0 as TimelineObjCCGInput
		settings = (
			<>
				<div className="setting">
					<label>Input Type (eg "decklink")</label>
					<TextInput
						currentValue={obj.content.inputType}
						onChange={(v) => {
							obj.content.inputType = v
							onSave(obj)
						}}
						allowUndefined={false}
					/>
				</div>
				<div className="setting">
					<label>Device Number</label>
					<IntInput
						currentValue={obj.content.device}
						onChange={(v) => {
							obj.content.device = v
							onSave(obj)
						}}
						allowUndefined={false}
					/>
				</div>
				<div className="setting">
					<label>Device Format</label>
					<SelectEnum
						currentValue={obj.content.deviceFormat}
						options={ChannelFormat}
						onChange={(v) => {
							obj.content.deviceFormat = v
							onSave(obj)
						}}
					/>
				</div>
				<div className="setting">
					<label>Filter</label>
					<TextInput
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
				{showAllButton}
			</>
		)
	} else if (obj.content.type === TimelineContentTypeCasparCg.TEMPLATE) {
		const obj = obj0 as TimelineObjCCGTemplate
		settings = (
			<>
				<div className="setting">
					<label>Template Type</label>
					<SelectEnum
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
					<label>Name</label>
					<TextInput
						currentValue={obj.content.name}
						onChange={(v) => {
							obj.content.name = v
							onSave(obj)
						}}
						allowUndefined={false}
					/>
				</div>
				<div className="setting">
					<label>Data</label>
					<TextInput
						currentValue={obj.content.data}
						onChange={(v) => {
							obj.content.data = v
							onSave(obj)
						}}
						allowUndefined={true}
					/>
				</div>
				<div className="setting">
					<label>Send stop() on stop</label>
					<BooleanInput
						currentValue={obj.content.useStopCommand}
						onChange={(v) => {
							obj.content.useStopCommand = v
							onSave(obj)
						}}
					/>
				</div>
			</>
		)
	} else if (obj.content.type === TimelineContentTypeCasparCg.HTMLPAGE) {
		const obj = obj0 as TimelineObjCCGHTMLPage
		settings = (
			<>
				<div className="setting">
					<label>URL</label>
					<TextInput
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
					<label>mappedLayer</label>
					<TextInput
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
							<label>channel</label>
							<IntInput
								currentValue={obj.content.channel}
								onChange={(v) => {
									obj.content.channel = v
									onSave(obj)
								}}
								allowUndefined={true}
							/>
						</div>
						<div className="setting">
							<label>layer</label>
							<IntInput
								currentValue={obj.content.layer}
								onChange={(v) => {
									obj.content.layer = v
									onSave(obj)
								}}
								allowUndefined={true}
							/>
						</div>
					</>
				) : null}

				<div className="setting">
					<label>mode</label>
					<SelectEnum
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
					<label>Delay</label>
					<DurationInput
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
				{showAllButton}
			</>
		)
	} else if (obj.content.type === TimelineContentTypeCasparCg.RECORD) {
		const obj = obj0 as TimelineObjCCGRecord

		settings = (
			<>
				<div className="setting">
					<label>File name</label>
					<TextInput
						currentValue={obj.content.file}
						onChange={(v) => {
							obj.content.file = v
							onSave(obj)
						}}
						allowUndefined={false}
					/>
				</div>
				<div className="setting">
					<label>Encoder Options</label>
					<TextInput
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
