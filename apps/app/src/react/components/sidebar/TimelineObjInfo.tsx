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

type MyFormValues = {
	enableStart: number
	enableDuration: number
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

	const initialValues: MyFormValues = {
		enableStart: (props.timelineObj.obj.enable as any)?.start,
		enableDuration: (props.timelineObj.obj.enable as any)?.duration,
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
						editedTimelineObj.obj.enable.start = values.enableStart
						editedTimelineObj.obj.enable.duration = values.enableDuration
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
						.catch(console.error)
					actions.setSubmitting(false)
				}}
			>
				{() => (
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
						<FormRow>
							<label htmlFor="enableStart">Start (ms)</label>
							<Field id="enableStart" name="enableStart" type="number" placeholder="0" />
							<ErrorMessage name="enableStart" component="div" />
						</FormRow>
						<FormRow>
							<label htmlFor="enableDuration">Duration (ms)</label>
							<Field id="enableDuration" name="enableDuration" type="number" placeholder="0" />
							<ErrorMessage name="enableDuration" component="div" />
						</FormRow>
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
										.catch(console.error)
								}}
							/>
							<Button type="submit" className="btn" variant="contained">
								Save
							</Button>
						</div>
					</Form>
				)}
			</Formik>
		</InfoGroup>
	)
}
