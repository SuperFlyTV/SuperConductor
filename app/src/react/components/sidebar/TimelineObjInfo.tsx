import {
	DELETE_TIMELINE_OBJ_CHANNEL,
	IDeleteTimelineObjChannel,
	IUpdateTimelineObj,
	UPDATE_TIMELINE_OBJ_CHANNEL,
} from '@/ipc/channels'
import { ErrorMessage, Field, Form, Formik } from 'formik'
import React from 'react'
import { Mappings, TSRTimelineObj } from 'timeline-state-resolver-types'
import { TrashBtn } from '../inputs/TrashBtn'
import { DataRow, FormRow } from './DataRow'
import { InfoGroup } from './InfoGroup'
const { ipcRenderer } = window.require('electron')

type MyFormValues = {
	enableStart: number
	enableDuration: number
	layer: string | number
}

type PropsType = {
	timelineObj: TSRTimelineObj
	appMappings: Mappings | undefined
}

export const TimelineObjInfo = (props: PropsType) => {
	const initialValues: MyFormValues = {
		enableStart: (props.timelineObj.enable as any)?.start,
		enableDuration: (props.timelineObj.enable as any)?.duration,
		layer: props.timelineObj.layer,
	}

	return (
		<InfoGroup title="Timeline object">
			<DataRow label="ID" value={props.timelineObj.id} />

			<Formik
				initialValues={initialValues}
				enableReinitialize={true}
				onSubmit={(values, actions) => {
					const updateObj: IUpdateTimelineObj = {
						id: props.timelineObj.id,
						layer: values.layer,
						enableStart: values.enableStart,
						enableDuration: values.enableDuration,
					}
					ipcRenderer.send(UPDATE_TIMELINE_OBJ_CHANNEL, updateObj)
					actions.setSubmitting(false)
				}}
			>
				{(formik) => (
					<Form>
						<FormRow>
							<label htmlFor="layer">Layer</label>
							<Field as="select" name="layer">
								{props.appMappings &&
									Object.keys(props.appMappings).map((key) => (
										<option key={key} value={key}>
											{key}
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
									const data: IDeleteTimelineObjChannel = { timelineObjId: props.timelineObj.id }
									ipcRenderer.send(DELETE_TIMELINE_OBJ_CHANNEL, data)
								}}
							/>
							<button type="submit" className="btn form">
								Save
							</button>
						</div>
					</Form>
				)}
			</Formik>
		</InfoGroup>
	)
}
