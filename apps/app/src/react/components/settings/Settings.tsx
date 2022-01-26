import { deepClone } from '@shared/lib'
import { ErrorMessage, Field, FieldArray, Form, Formik } from 'formik'
import React, { useContext } from 'react'
import { DeviceType, Mapping, MappingCasparCG } from 'timeline-state-resolver-types'
import { literal } from '@shared/lib'
import { Bridge } from '../../../models/project/Bridge'
import { Project } from '../../../models/project/Project'
import { IPCServerContext } from '../../contexts/IPCServer'
import { TrashBtn } from '../inputs/TrashBtn'
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

	console.log(project.bridges)

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

						<div className="title">Mappings</div>

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
												<Field as="select" name={`mappings.${index}.1.deviceId`}>
													{listAvailableDeviceIDs(formik.values.bridges).map((deviceId) => (
														<option key={deviceId} value={deviceId}>
															{deviceId}
														</option>
													))}
												</Field>
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

											<div className="btn-row-equal">
												<TrashBtn
													onClick={() => {
														remove(index)
													}}
												/>
											</div>

											<hr style={{ width: '80%' }} />
										</React.Fragment>
									))}

									<button
										className="btn form"
										type="button"
										onClick={() =>
											push([
												'new-mapping',
												literal<MappingCasparCG>({
													device: DeviceType.CASPARCG,
													deviceId: 'casparcg0',
													layerName: 'New Mapping',
													channel: 1,
													layer: 10,
												}),
											])
										}
									>
										Add Mapping
									</button>
								</div>
							)}
						</FieldArray>

						<hr />

						<div className="title">Bridges</div>

						<FieldArray name="bridges">
							{({ remove, push }) => (
								<div>
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
												<label>
													Outgoing{' '}
													<Field name={`bridges.${index}.1.outgoing`} type="checkbox" />
												</label>
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

											<hr style={{ width: '80%' }} />
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

						<hr />

						<div className="btn-row-equal">
							<button type="submit" className="btn form">
								Save All
							</button>
						</div>
					</Form>
				)}
			</Formik>
		</InfoGroup>
	)
}

function listAvailableDeviceIDs(bridges: ProjectFormValues['bridges']): string[] {
	const deviceIDs = new Set<string>()
	for (const [_bridgeId, bridge] of bridges) {
		for (const deviceId in bridge.settings.devices) {
			deviceIDs.add(deviceId)
		}
	}
	return Array.from(deviceIDs)
}
