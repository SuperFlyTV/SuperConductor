import { IPCServerContext } from '../../../contexts/IPCServer'
import { Form, Formik } from 'formik'
import React, { useContext } from 'react'
import { Mappings } from 'timeline-state-resolver-types'
import { TimelineObj } from '../../../../models/rundown/TimelineObj'
import { TrashBtn } from '../../inputs/TrashBtn'
import { DataRow } from '../SidebarInfoGroup'
import { SidebarInfoGroup } from '../SidebarInfoGroup'
import { deepClone } from '@shared/lib'
import { Button, MenuItem } from '@mui/material'
import { TimelineEnable } from 'superfly-timeline'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler'
import { GUIContext } from '../../../contexts/GUI'
import { TextField } from '@mui/material'
import { DurationInput } from '../../inputs/DurationInput'
import { TextInput } from '../../inputs/TextInput'
// import { ParsedValueInput } from '../timelineObj/input/parsedValue'
// import { DurationInput } from '../timelineObj/input/duration'

export const TimelineObjData: React.FC<{
	rundownId: string
	groupId: string
	partId: string
	timelineObj: TimelineObj
	mappings: Mappings | undefined
}> = (props) => {
	const ipcServer = useContext(IPCServerContext)
	const { gui, updateGUI } = useContext(GUIContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const enable: TimelineEnable = Array.isArray(props.timelineObj.obj.enable)
		? props.timelineObj.obj.enable[0]
		: props.timelineObj.obj.enable

	const startIsExpression = typeof enable.start === 'string'
	const durationIsExpression = typeof enable.duration === 'string'

	return (
		<SidebarInfoGroup title="Timeline object">
			<DataRow label="ID" value={props.timelineObj.obj.id} />

			<Formik
				initialValues={{
					enableStartNum: typeof enable.start === 'number' ? enable.start : 0,
					enableStartExpression: typeof enable.start === 'string' ? enable.start : '',

					enableDurationNum: typeof enable.duration === 'number' ? enable.duration : 0,
					enableDurationExpression: typeof enable.duration === 'string' ? enable.duration : '',

					layer: props.timelineObj.obj.layer,
				}}
				enableReinitialize={true}
				onSubmit={async (values, actions) => {
					const editedTimelineObj = deepClone(props.timelineObj)
					if (!Array.isArray(editedTimelineObj.obj.enable)) {
						editedTimelineObj.obj.enable.start = values.enableStartExpression || values.enableStartNum || 0
						editedTimelineObj.obj.enable.duration =
							values.enableDurationExpression || values.enableDurationNum || 0
					}

					editedTimelineObj.obj.layer = values.layer

					try {
						await ipcServer.updateTimelineObj({
							rundownId: props.rundownId,
							groupId: props.groupId,
							partId: props.partId,
							timelineObjId: props.timelineObj.obj.id,
							timelineObj: editedTimelineObj,
						})
					} catch (error) {
						handleError(error)
					}

					actions.setSubmitting(false)
				}}
			>
				{(formik) => (
					<Form>
						<TextField
							select
							fullWidth
							label="Layer"
							id="layer"
							name="layer"
							value={formik.values.layer}
							onChange={formik.handleChange}
						>
							{props.mappings &&
								Object.entries(props.mappings).map(([key, value]) => (
									<MenuItem key={key} value={key}>
										{value.layerName ?? key}
									</MenuItem>
								))}
						</TextField>

						{startIsExpression ? (
							<TextInput
								label="Start"
								allowUndefined={false}
								currentValue={formik.values.enableStartExpression}
								onChange={(newVal) => {
									formik.setFieldValue('enableStartExpression', newVal)
								}}
							/>
						) : (
							<DurationInput
								label="Start"
								allowUndefined={false}
								currentValue={formik.values.enableStartNum}
								onChange={(newVal) => {
									formik.setFieldValue('enableStartNum', newVal)
								}}
							/>
						)}

						{durationIsExpression ? (
							<TextInput
								label="Duration"
								allowUndefined={false}
								currentValue={formik.values.enableDurationExpression}
								onChange={(newVal) => {
									formik.setFieldValue('enableDurationExpression', newVal)
								}}
							/>
						) : (
							<DurationInput
								label="Duration"
								allowUndefined={false}
								currentValue={formik.values.enableDurationNum}
								onChange={(newVal) => {
									formik.setFieldValue('enableDurationNum', newVal)
								}}
							/>
						)}

						<div className="btn-row-equal">
							<TrashBtn
								onClick={() => {
									ipcServer
										.deleteTimelineObj({
											rundownId: props.rundownId,
											groupId: props.groupId,
											partId: props.partId,
											timelineObjId: props.timelineObj.obj.id,
										})
										.then(() => {
											updateGUI({
												selectedTimelineObjIds: gui.selectedTimelineObjIds.filter(
													(id) => id !== props.timelineObj.obj.id
												),
											})
										})
										.catch(handleError)
								}}
							/>
							<Button type="submit" className="btn" variant="contained" disabled={!formik.dirty}>
								Save
							</Button>
						</div>
					</Form>
				)}
			</Formik>
		</SidebarInfoGroup>
	)
}
