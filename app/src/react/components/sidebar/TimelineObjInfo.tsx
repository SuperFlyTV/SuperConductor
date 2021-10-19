import { IUpdateTimelineObj, UPDATE_TIMELINE_OBJ_CHANNEL } from '@/ipc/channels'
import { ErrorMessage, Field, Form, Formik } from 'formik'
import React from 'react'
import { TSRTimelineObj } from 'timeline-state-resolver-types'
import { DataRow, FormRow } from './DataRow'
import { InfoGroup } from './InfoGroup'
const { ipcRenderer } = window.require('electron')

type MyFormValues = {
	enableStart: number
	enableDuration: number
}

export const TimelineObjInfo = ({ timelineObj }: { timelineObj: TSRTimelineObj }) => {
	const initialValues: MyFormValues = {
		enableStart: (timelineObj.enable as any)?.start,
		enableDuration: (timelineObj.enable as any)?.duration,
	}

	return (
		<InfoGroup title="Timeline object">
			<DataRow label="ID" value={timelineObj.id} />

			<Formik
				initialValues={initialValues}
				enableReinitialize={true}
				onSubmit={(values, actions) => {
					const updateObj: IUpdateTimelineObj = {
						id: timelineObj.id,
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
							<label htmlFor="enableStart">Start (ms)</label>
							<Field id="enableStart" name="enableStart" type="number" placeholder="0" />
							<ErrorMessage name="enableStart" component="div" />
						</FormRow>
						<FormRow>
							<label htmlFor="enableDuration">Duration (ms)</label>
							<Field id="enableDuration" name="enableDuration" type="number" placeholder="0" />
							<ErrorMessage name="enableDuration" component="div" />
						</FormRow>
						<div className="btn-row-right">
							<button type="submit" className="btn form">
								Save changes
							</button>
						</div>
					</Form>
				)}
			</Formik>
		</InfoGroup>
	)
}
