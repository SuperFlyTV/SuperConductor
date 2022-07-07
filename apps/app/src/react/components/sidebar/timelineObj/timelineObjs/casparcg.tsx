import React from 'react'
import { assertNever, deepClone } from '@shared/lib'
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
					currentValue={(obj.content as any).casparXMLData}
					onChange={(v) => {
						;(obj.content as any).casparXMLData = v
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
