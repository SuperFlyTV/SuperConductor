import { MenuItem, TextField } from '@mui/material'
import React, { useContext } from 'react'
import { TimelineEnable } from 'superfly-timeline'
import { DeviceType, TSRTimelineObj } from 'timeline-state-resolver-types'
import { ProjectContext } from '../../../../contexts/Project'
import { DurationInput } from '../../../inputs/DurationInput'
import { SelectEnum } from '../../../inputs/SelectEnum'
import { TextInput } from '../../../inputs/TextInput'

export type OnSave = (newObj: TSRTimelineObj) => void

export const EditWrapper: React.FC<{
	obj: TSRTimelineObj
	onSave: OnSave
}> = ({ obj, onSave, children }) => {
	const project = useContext(ProjectContext)

	const enable: TimelineEnable = Array.isArray(obj.enable) ? obj.enable[0] : obj.enable

	const startIsExpression = typeof enable.start === 'string'
	const enableStartNum = typeof enable.start === 'number' ? enable.start : 0
	const enableStartExpression = typeof enable.start === 'string' ? enable.start : ''

	const durationIsExpression = typeof enable.duration === 'string'
	const enableDurationNum = typeof enable.duration === 'number' ? enable.duration : 0
	const enableDurationExpression = typeof enable.duration === 'string' ? enable.duration : ''

	return (
		<div className="edit-timeline-obj">
			<div className="settings">
				<div className="setting">
					<SelectEnum
						label={'Device Type'}
						fullWidth
						currentValue={obj.content.deviceType}
						options={DeviceType}
						onChange={(newValue) => {
							obj.content.deviceType = newValue
							onSave(obj)
						}}
					/>

					<TextField
						select
						fullWidth
						size="small"
						label="Layer"
						id="layer"
						name="layer"
						margin="dense"
						value={obj.layer}
						onChange={(e) => {
							obj.layer = e.target.value
							onSave(obj)
						}}
					>
						{project.mappings &&
							Object.entries(project.mappings)
								.filter(([_key, value]) => {
									return value.device === obj.content.deviceType
								})
								.map(([key, value]) => (
									<MenuItem key={key} value={key}>
										{value.layerName ?? key}
									</MenuItem>
								))}
					</TextField>

					{startIsExpression ? (
						<TextInput
							label="Start"
							fullWidth
							allowUndefined={false}
							currentValue={enableStartExpression}
							onChange={(newVal) => {
								if (!Array.isArray(obj.enable)) {
									obj.enable.start = newVal
								}
								onSave(obj)
							}}
						/>
					) : (
						<DurationInput
							label="Start"
							fullWidth
							allowUndefined={false}
							currentValue={enableStartNum}
							onChange={(newVal) => {
								if (!Array.isArray(obj.enable)) {
									obj.enable.start = newVal
								}
								onSave(obj)
							}}
						/>
					)}

					{durationIsExpression ? (
						<TextInput
							label="Duration"
							fullWidth
							allowUndefined={false}
							currentValue={enableDurationExpression}
							onChange={(newVal) => {
								if (!Array.isArray(obj.enable)) {
									obj.enable.duration = newVal
								}
								onSave(obj)
							}}
						/>
					) : (
						<DurationInput
							label="Duration"
							fullWidth
							allowUndefined={false}
							currentValue={enableDurationNum}
							onChange={(newVal) => {
								if (!Array.isArray(obj.enable)) {
									obj.enable.duration = newVal
								}
								onSave(obj)
							}}
						/>
					)}
				</div>
				{children}
			</div>
		</div>
	)
}

export const NOT_IMPLEMENTED_SETTINGS = (
	<div className="setting">
		<label>Not implemented</label>
		<div>
			<i>
				Support for this type of timeline object hasn&apos;t been implemented yet. Feel free to submit a pull
				request!
			</i>
		</div>
	</div>
)
