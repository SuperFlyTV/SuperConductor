import { deepClone } from '@shared/lib'
import { ErrorMessage, Field, FieldArray, Form, Formik } from 'formik'
import React, { useContext } from 'react'
import { DeviceType, Mapping, MappingCasparCG } from 'timeline-state-resolver-types'
import { literal } from '@shared/lib'
import { Project } from '../../../models/project/Project'
import { IPCServerContext } from '../../contexts/IPCServer'
import { TrashBtn } from '../inputs/TrashBtn'
import { FormRow } from '../sidebar/InfoGroup'

type MappingsFormValues = {
	mappings: Array<[string, Mapping]>
}

export const MappingSettings: React.FC<{ project: Project }> = ({ project }) => {
	const ipcServer = useContext(IPCServerContext)
	const initialValues: MappingsFormValues = {
		mappings: Object.entries(deepClone(project.mappings)),
	}

	return (
		<Formik
			initialValues={initialValues}
			enableReinitialize={true}
			onSubmit={async (values, actions) => {
				const editedMappings = Object.fromEntries(values.mappings)
				const editedProject: Project = {
					...project,
					mappings: editedMappings,
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
					<FieldArray name="mappings">
						{({ remove, push }) => (
							<div className="form-body">
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
												{listAvailableDeviceIDs(project.bridges).map((deviceId) => (
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

										<hr />
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

function listAvailableDeviceIDs(bridges: Project['bridges']): string[] {
	const deviceIDs = new Set<string>()
	for (const bridgeId in bridges) {
		const bridge = bridges[bridgeId]
		for (const deviceId in bridge.settings.devices) {
			deviceIDs.add(deviceId)
		}
	}
	return Array.from(deviceIDs)
}
