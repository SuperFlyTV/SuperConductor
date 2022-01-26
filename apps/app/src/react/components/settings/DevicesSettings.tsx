import { deepClone } from '@shared/lib'
import { ErrorMessage, Field, FieldArray, Form, Formik } from 'formik'
import React, { ReactText, useContext, useRef } from 'react'
import { DeviceOptionsAny, DeviceOptionsCasparCG, DeviceType } from 'timeline-state-resolver-types'
import { literal } from '@shared/lib'
import { Project } from '../../../models/project/Project'
import { IPCServerContext } from '../../contexts/IPCServer'
import { TrashBtn } from '../inputs/TrashBtn'
import { FormRow } from '../sidebar/InfoGroup'
import { toast } from 'react-toastify'

type DevicesFormValues = {
	devices: Array<[string, DeviceOptionsAny]>
}

export const DevicesSettings: React.FC<{ project: Project; bridgeId: string }> = ({ project, bridgeId }) => {
	const ipcServer = useContext(IPCServerContext)
	const toastId = useRef<ReactText>()
	const bridge = project.bridges[bridgeId]
	const initialValues: DevicesFormValues = {
		devices: Object.entries(deepClone(bridge.settings.devices)),
	}

	const notify = () => (toastId.current = toast('Saving Devices...', { autoClose: false }))
	const updateSuccess = () => {
		if (toastId.current) {
			toast.update(toastId.current, { render: 'Devices saved!', type: toast.TYPE.SUCCESS, autoClose: 5000 })
		}
	}
	const updateFail = (message: string) => {
		if (toastId.current) {
			toast.update(toastId.current, {
				render: `Error when saving Devices: ${message}`,
				type: toast.TYPE.ERROR,
				autoClose: 5000,
			})
		}
	}

	return (
		<>
			<Formik
				initialValues={initialValues}
				enableReinitialize={true}
				onSubmit={async (values, actions) => {
					notify()
					const editedDevices = Object.fromEntries(values.devices)

					// The <select> element will return a string that we need to turn into a number.
					for (const dev in editedDevices) {
						if (typeof editedDevices[dev].type !== 'number') {
							editedDevices[dev].type = parseInt(editedDevices[dev].type as any, 10)
						}
					}

					const editedBridge = {
						...bridge,
						settings: {
							...bridge.settings,
							devices: editedDevices,
						},
					}
					const editedBridges = {
						...project.bridges,
					}
					editedBridges[bridgeId] = editedBridge
					const editedProject: Project = {
						...project,
						bridges: editedBridges,
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
						<FieldArray name="devices">
							{({ remove, push }) => (
								<div className="form-body">
									{formik.values.devices.map((_, index) => (
										<React.Fragment key={index}>
											<FormRow>
												<label htmlFor={`devices.${index}.0`}>Device ID</label>
												<Field
													id={`devices.${index}.0`}
													name={`devices.${index}.0`}
													type="text"
													placeholder="ID"
												/>
												<ErrorMessage name={`devices.${index}.0`} component="div" />
											</FormRow>

											<FormRow>
												<label htmlFor={`devices.${index}.1.type`}>Device Type</label>
												<Field as="select" name={`devices.${index}.1.type`}>
													<option value={DeviceType.CASPARCG}>CasparCG</option>
													<option value={DeviceType.ATEM}>ATEM</option>
												</Field>
											</FormRow>

											<FormRow>
												<label htmlFor={`devices.${index}.1.options.host`}>Device Host</label>
												<Field
													id={`devices.${index}.1.options.host`}
													name={`devices.${index}.1.options.host`}
													type="text"
													placeholder="127.0.0.1"
												/>
												<ErrorMessage
													name={`devices.${index}.1.options.host`}
													component="div"
												/>
											</FormRow>

											<FormRow>
												<label htmlFor={`devices.${index}.1.options.port`}>Device Port</label>
												<Field
													id={`devices.${index}.1.options.port`}
													name={`devices.${index}.1.options.port`}
													type="number"
													placeholder="5250"
													min="1"
													max="65535"
												/>
												<ErrorMessage
													name={`devices.${index}.1.options.port`}
													component="div"
												/>
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
												'new-device',
												literal<DeviceOptionsCasparCG>({
													type: DeviceType.CASPARCG,
													options: {
														host: '127.0.0.1',
														port: 5250,
													},
												}),
											])
										}
									>
										Add Device
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
		</>
	)
}
