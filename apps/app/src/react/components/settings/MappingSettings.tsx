import { deepClone } from '@shared/lib'
import { ErrorMessage, Field, FieldArray, Form, Formik } from 'formik'
import React, { ReactText, useContext, useRef } from 'react'
import { DeviceType, Mapping, MappingCasparCG } from 'timeline-state-resolver-types'
import { literal } from '@shared/lib'
import { Project } from '../../../models/project/Project'
import { IPCServerContext } from '../../contexts/IPCServer'
import { TrashBtn } from '../inputs/TrashBtn'
import { FormRow } from '../sidebar/InfoGroup'
import { toast } from 'react-toastify'

type MappingsFormValues = {
	mappings: Array<[string, Mapping]>
}

export const MappingSettings: React.FC<{ project: Project }> = ({ project }) => {
	const ipcServer = useContext(IPCServerContext)
	const toastId = useRef<ReactText>()
	const initialValues: MappingsFormValues = {
		mappings: Object.entries(deepClone(project.mappings)),
	}

	const notify = () => (toastId.current = toast('Saving Mappings...', { autoClose: false }))
	const updateSuccess = () => {
		if (toastId.current) {
			toast.update(toastId.current, { render: 'Mappings saved! ✓', type: toast.TYPE.SUCCESS, autoClose: 5000 })
		}
	}
	const updateFail = (message: string) => {
		if (toastId.current) {
			toast.update(toastId.current, {
				render: `Error when saving Mappings: ${message}`,
				type: toast.TYPE.ERROR,
				autoClose: 5000,
			})
		}
	}

	return (
		<Formik
			initialValues={initialValues}
			enableReinitialize={true}
			onSubmit={async (values, actions) => {
				notify()
				const editedMappings = Object.fromEntries(values.mappings)
				const editedProject: Project = {
					...project,
					mappings: editedMappings,
				}
				try {
					await ipcServer.updateProject({ id: editedProject.id, project: editedProject })
					updateSuccess()
				} catch (error) {
					console.error(error)
					updateFail((error as any).message)
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
						<button type="submit" className="btn form" disabled={formik.isSubmitting}>
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
