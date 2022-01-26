import { deepClone } from '@shared/lib'
import { ErrorMessage, Field, FieldArray, Form, Formik } from 'formik'
import React, { useContext } from 'react'
import { DeviceType, Mapping } from 'timeline-state-resolver-types'
import { Bridge } from '../../../models/project/Bridge'
import { Project } from '../../../models/project/Project'
import { IPCServerContext } from '../../contexts/IPCServer'
import { DataRow, FormRow, InfoGroup } from '../sidebar/InfoGroup'

type ProjectFormValues = {
	name: Project['name']
	mappings: Array<[string, Mapping]>
	bridges: Array<[string, Bridge]>
}

export const Settings: React.FC<{ project: Project; onSubmit?: () => void }> = ({ project, onSubmit }) => {
	const ipcServer = useContext(IPCServerContext)
	const initialValues: ProjectFormValues = {
		name: project.name,
		mappings: Object.entries(deepClone(project.mappings)),
		bridges: Object.entries(deepClone(project.bridges)),
	}

	return (
		<InfoGroup title="Project settings">
			<DataRow label="ID" value={project.id} />

			<Formik
				initialValues={initialValues}
				enableReinitialize={true}
				onSubmit={async (values, actions) => {
					const editedMappings = Object.fromEntries(values.mappings)
					const editedBridges = Object.fromEntries(values.bridges)
					const editedProject: Project = {
						id: project.id,
						name: values.name,
						mappings: editedMappings,
						bridges: editedBridges,
						settings: project.settings,
					}
					try {
						await ipcServer.updateProject({ id: editedProject.id, project: editedProject })
					} catch (error) {
						console.error(error)
					}
					actions.setSubmitting(false)
					if (onSubmit) {
						onSubmit()
					}
				}}
			>
				{(formik) => (
					<Form>
						<FormRow>
							<label htmlFor="projectName">Project Name</label>
							<Field id="projectName" name="name" type="text" placeholder="Name" />
							<ErrorMessage name="name" component="div" />
						</FormRow>

						<hr />

						<FieldArray name="mappings">
							{({ remove, push }) => (
								<div>
									{formik.values.mappings.map((_, index) => (
										<React.Fragment key={index}>
											<FormRow>
												<label htmlFor={`mappings.${index}.0`}>Mapping ID</label>
												<Field
													id={`mappings.${index}.0`}
													name={`mappings.${index}.0`}
													type="text"
													placeholder="ID"
												/>
												<ErrorMessage name={`mappings.${index}.0`} component="div" />
											</FormRow>

											<FormRow>
												<label htmlFor={`mappings.${index}.1.layerName`}>Mapping Name</label>
												<Field
													id={`mappings.${index}.1.layerName`}
													name={`mappings.${index}.1.layerName`}
													type="text"
													placeholder="Name"
												/>
												<ErrorMessage name={`mappings.${index}.1.layerName`} component="div" />
											</FormRow>

											{/* <FormRow>
												<label htmlFor={`mappings.${index}.1.device`}>Device Type</label>
												<Field as="select" name={`mappings.${index}.1.device`}>
													<option value={DeviceType.CASPARCG}>CasparCG</option>
												</Field>
											</FormRow> */}

											<FormRow>
												<label htmlFor={`mappings.${index}.1.deviceId`}>Device ID</label>
												<Field
													id={`mappings.${index}.1.deviceId`}
													name={`mappings.${index}.1.deviceId`}
													type="text"
													placeholder="Device ID"
												/>
												<ErrorMessage name={`mappings.${index}.1.deviceId`} component="div" />
											</FormRow>

											<FormRow>
												<label htmlFor={`mappings.${index}.1.channel`}>Channel</label>
												<Field
													id={`mappings.${index}.1.channel`}
													name={`mappings.${index}.1.channel`}
													type="number"
													placeholder="1"
												/>
												<ErrorMessage name={`mappings.${index}.1.channel`} component="div" />
											</FormRow>

											<FormRow>
												<label htmlFor={`mappings.${index}.1.layer`}>Layer</label>
												<Field
													id={`mappings.${index}.1.layer`}
													name={`mappings.${index}.1.layer`}
													type="number"
													placeholder="1"
												/>
												<ErrorMessage name={`mappings.${index}.1.layer`} component="div" />
											</FormRow>

											<button type="button" onClick={() => remove(index)}>
												X
											</button>

											<hr />
										</React.Fragment>
									))}

									<button
										type="button"
										onClick={() =>
											push([
												'new-mapping',
												{
													device: DeviceType.CASPARCG,
													deviceId: 'casparcg0',
													layerName: 'New Mapping',
													channel: 1,
													layer: 10,
												},
											])
										}
									>
										Add Mapping
									</button>
								</div>
							)}
						</FieldArray>

						{/* <FormRow>
							<label htmlFor="enableDuration">Duration (ms)</label>
							<Field id="enableDuration" name="enableDuration" type="number" placeholder="0" />
							<ErrorMessage name="enableDuration" component="div" />
						</FormRow> */}
						<div className="btn-row-equal">
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
