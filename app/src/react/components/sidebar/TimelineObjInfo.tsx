import { IPCServerContext } from '@/react/App'
import { ErrorMessage, Field, Form, Formik } from 'formik'
import React, { useContext } from 'react'
import { Mappings, TSRTimelineObj } from 'timeline-state-resolver-types'
import { TrashBtn } from '../inputs/TrashBtn'
import { DataRow, FormRow } from './DataRow'
import { InfoGroup } from './InfoGroup'

type MyFormValues = {
	enableStart: number
	enableDuration: number
	layer: string | number
}

export const TimelineObjInfo: React.FC<{
	timelineObj: TSRTimelineObj
	appMappings: Mappings | undefined
}> = (props) => {
	const ipcServer = useContext(IPCServerContext)

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
					ipcServer.updateTimelineObj({
						timelineObjId: props.timelineObj.id,
						layer: values.layer,
						enableStart: values.enableStart,
						enableDuration: values.enableDuration,
					})
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
									ipcServer.deleteTimelineObj({ timelineObjId: props.timelineObj.id })
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
