import { deepClone } from '@shared/lib'
import { ErrorMessage, Field, FieldArray, Form, Formik } from 'formik'
import React, { useContext } from 'react'
import { DeviceType } from 'timeline-state-resolver-types'
import { literal } from '@shared/lib'
import { Bridge } from '../../../models/project/Bridge'
import { Project } from '../../../models/project/Project'
import { IPCServerContext } from '../../contexts/IPCServer'
import { TrashBtn } from '../inputs/TrashBtn'
import { FormRow } from '../sidebar/InfoGroup'

type BridgesFormValues = {
	bridges: Array<[string, Bridge]>
}

export const BridgesSettings: React.FC<{ project: Project }> = ({ project }) => {
	const ipcServer = useContext(IPCServerContext)
	const initialValues: BridgesFormValues = {
		bridges: Object.entries(deepClone(project.bridges)),
	}

	console.log(project.bridges)

	return (
		<Formik
			initialValues={initialValues}
			enableReinitialize={true}
			onSubmit={async (values, actions) => {
				const editedBridges = Object.fromEntries(values.bridges)
				const editedProject: Project = {
					...project,
					bridges: editedBridges,
				}
				try {
					await ipcServer.updateProject({ id: editedProject.id, project: editedProject })
				} catch (error) {
					console.error(error)
				}
				actions.setSubmitting(false)
			}}
		>
			{(formik) => (
				<Form>
					<FieldArray name="bridges">
						{({ remove, push }) => (
							<div className="form-body">
								{formik.values.bridges.map((_, index) => (
									<React.Fragment key={index}>
										<FormRow>
											<label htmlFor={`bridges.${index}.0`}>Bridge ID</label>
											<Field
												id={`bridges.${index}.0`}
												name={`bridges.${index}.0`}
												type="text"
												placeholder="ID"
											/>
											<ErrorMessage name={`bridges.${index}.0`} component="div" />
										</FormRow>

										<FormRow>
											<label htmlFor={`bridges.${index}.1.name`}>Bridge Name</label>
											<Field
												id={`bridges.${index}.1.name`}
												name={`bridges.${index}.1.name`}
												type="text"
												placeholder="Name"
											/>
											<ErrorMessage name={`bridges.${index}.1.name`} component="div" />
										</FormRow>

										<FormRow>
											<label htmlFor={`bridges.${index}.1.outgoing`}>Outgoing</label>
											<Field
												id={`bridges.${index}.1.outgoing`}
												name={`bridges.${index}.1.outgoing`}
												type="checkbox"
											/>
										</FormRow>

										<FormRow>
											<label htmlFor={`bridges.${index}.1.url`}>URL</label>
											<Field
												id={`bridges.${index}.1.url`}
												name={`bridges.${index}.1.url`}
												type="text"
												placeholder="URL"
											/>
											<ErrorMessage name={`bridges.${index}.1.url`} component="div" />
										</FormRow>

										<div className="btn-row-equal">
											<TrashBtn
												onClick={() => {
													remove(index)
												}}
											/>
										</div>

										<hr />
									</React.Fragment>
								))}

								<button
									className="btn form"
									type="button"
									onClick={() =>
										push([
											'new-bridge',
											literal<Bridge>({
												id: 'new-bridge',
												name: 'New Bridge',
												outgoing: true,
												url: 'ws://localhost:5401',
												settings: {
													devices: {
														casparcg0: {
															type: DeviceType.CASPARCG,
															options: { host: '127.0.0.1', port: 5250 },
														},
													},
												},
											}),
										])
									}
								>
									Add Bridge
								</button>
							</div>
						)}
					</FieldArray>

					<div className="btn-row-equal">
						<button type="submit" className="btn form">
							Save
						</button>
					</div>
				</Form>
			)}
		</Formik>
	)
}
