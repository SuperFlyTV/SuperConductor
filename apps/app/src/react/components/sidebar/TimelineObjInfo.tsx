import { IPCServerContext } from '../../contexts/IPCServer'
import { ErrorMessage, Field, Form, Formik } from 'formik'
import React, { useContext } from 'react'
import { Mappings } from 'timeline-state-resolver-types'
import { TimelineObj } from '../../../models/rundown/TimelineObj'
import { TrashBtn } from '../inputs/TrashBtn'
import { DataRow, FormRow } from './InfoGroup'
import { InfoGroup } from './InfoGroup'
import { deepClone } from '@shared/lib'
import { Button } from '@mui/material'
import { TimelineEnable } from 'superfly-timeline'
import { ErrorHandlerContext } from '../../contexts/ErrorHandler'
import { GUIContext } from '../../contexts/GUI'

type MyFormValues = {
	enableStartNum: number
	enableStartExpression: string
	enableDurationNum: number
	enableDurationExpression: string
	layer: string | number
}

export const TimelineObjInfo: React.FC<{
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

	const initialValues: MyFormValues = {
		enableStartNum: typeof enable.start === 'number' ? enable.start : 0,
		enableStartExpression: typeof enable.start === 'string' ? enable.start : '',

		enableDurationNum: typeof enable.duration === 'number' ? enable.duration : 0,
		enableDurationExpression: typeof enable.duration === 'string' ? enable.duration : '',

		layer: props.timelineObj.obj.layer,
	}

	return (
		<InfoGroup title="Timeline object">
			<DataRow label="ID" value={props.timelineObj.obj.id} />

			<Formik
				initialValues={initialValues}
				enableReinitialize={true}
				onSubmit={(values, actions) => {
					const editedTimelineObj = deepClone(props.timelineObj)
					if (!Array.isArray(editedTimelineObj.obj.enable)) {
						editedTimelineObj.obj.enable.start = values.enableStartExpression || values.enableStartNum || 0
						editedTimelineObj.obj.enable.duration =
							values.enableDurationExpression || values.enableDurationNum || 0
					}
					editedTimelineObj.obj.layer = values.layer
					ipcServer
						.updateTimelineObj({
							rundownId: props.rundownId,
							groupId: props.groupId,
							partId: props.partId,
							timelineObjId: props.timelineObj.obj.id,
							timelineObj: editedTimelineObj,
						})
						.catch(handleError)
					actions.setSubmitting(false)
				}}
			>
				{(formik) => (
					<Form>
						<FormRow>
							<label htmlFor="layer">Layer</label>
							<Field as="select" name="layer">
								{props.mappings &&
									Object.entries(props.mappings).map(([key, value]) => (
										<option key={key} value={key}>
											{value.layerName ?? key}
										</option>
									))}
							</Field>
						</FormRow>
						{startIsExpression ? (
							<FormRow>
								<label htmlFor="enableStartExpression">Start</label>
								<Field
									id="enableStartExpression"
									name="enableStartExpression"
									type="text"
									placeholder=""
								/>
								<ErrorMessage name="enableStartExpression" component="div" />
							</FormRow>
						) : (
							<FormRow>
								<label htmlFor="enableStartNum">Start (ms)</label>
								<Field id="enableStartNum" name="enableStartNum" type="number" placeholder="0" />
								<ErrorMessage name="enableStartNum" component="div" />
							</FormRow>
						)}
						{durationIsExpression ? (
							<FormRow>
								<label htmlFor="enableDurationExpression">Duration</label>
								<Field
									id="enableDurationExpression"
									name="enableDurationExpression"
									type="text"
									placeholder=""
								/>
								<ErrorMessage name="enableDurationExpression" component="div" />
							</FormRow>
						) : (
							<FormRow>
								<label htmlFor="enableDurationNum">Duration (ms)</label>
								<Field id="enableDurationNum" name="enableDurationNum" type="number" placeholder="0" />
								<ErrorMessage name="enableDurationNum" component="div" />
							</FormRow>
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
		</InfoGroup>
	)
}
