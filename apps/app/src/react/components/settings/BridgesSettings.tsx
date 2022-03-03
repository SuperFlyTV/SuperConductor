import { deepClone } from '@shared/lib'
import { Field, FieldArray, Form, Formik } from 'formik'
import React, { useContext, useState } from 'react'
import { DeviceOptionsCasparCG, DeviceType } from 'timeline-state-resolver-types'
import { literal } from '@shared/lib'
import { Bridge } from '../../../models/project/Bridge'
import { Project } from '../../../models/project/Project'
import { IPCServerContext } from '../../contexts/IPCServer'
import { DevicesSettings } from './DevicesSettings'
import * as Yup from 'yup'
import { TextField } from 'formik-mui'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid } from '@mui/material'
import { useSnackbar } from 'notistack'

type BridgesFormValues = {
	bridges: Array<[string, Bridge]>
}

const validationSchema = Yup.object({
	bridges: Yup.array().of(
		Yup.tuple([
			Yup.string().label('ID').required(),
			Yup.object({
				name: Yup.string().label('Name').required(),
				url: Yup.string().label('URL').required(),
			}),
		])
	),
})

export const BridgesSettings: React.FC<{ project: Project }> = ({ project }) => {
	const ipcServer = useContext(IPCServerContext)
	const [bridgeIdForEditDevices, setBridgeIdForEditDevices] = useState<string>()
	const [devicesOpen, setDevicesOpen] = useState(false)
	const { enqueueSnackbar } = useSnackbar()

	const initialValues: BridgesFormValues = {
		bridges: Object.entries(deepClone(project.bridges)),
	}

	const handleDevicesClose = () => {
		setDevicesOpen(false)
	}

	return (
		<>
			<Formik
				initialValues={initialValues}
				enableReinitialize={true}
				validationSchema={validationSchema}
				onSubmit={async (values, actions) => {
					enqueueSnackbar('Saving Bridges...', { variant: 'info' })
					const editedBridges = Object.fromEntries(values.bridges)
					const editedProject: Project = {
						...project,
						bridges: editedBridges,
					}
					try {
						await ipcServer.updateProject({ id: editedProject.id, project: editedProject })
						enqueueSnackbar('Bridges saved!', { variant: 'success' })
					} catch (error) {
						console.error(error)
						enqueueSnackbar(`Error when saving Bridges: ${(error as any).message}`, {
							variant: 'error',
						})
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
											<Field
												component={TextField}
												margin="normal"
												fullWidth
												name={`bridges.${index}.0`}
												type="text"
												label="Bridge ID"
											/>

											<Field
												component={TextField}
												margin="normal"
												fullWidth
												name={`bridges.${index}.1.name`}
												type="text"
												label="Bridge Name"
											/>

											<Field
												component={TextField}
												margin="normal"
												fullWidth
												name={`bridges.${index}.1.url`}
												type="text"
												label="URL"
											/>

											<Grid container spacing={2}>
												<Grid item xs={6}>
													<Button
														color="error"
														variant="contained"
														fullWidth
														onClick={() => {
															remove(index)
														}}
													>
														Remove Bridge
													</Button>
												</Grid>
												<Grid item xs={6}>
													<Button
														color="info"
														variant="outlined"
														fullWidth
														onClick={() => {
															setBridgeIdForEditDevices(formik.values.bridges[index][0])
															setDevicesOpen(true)
														}}
													>
														Edit Devices
													</Button>
												</Grid>
											</Grid>

											<hr />
										</React.Fragment>
									))}

									<Button
										color="info"
										variant="contained"
										fullWidth
										onClick={() => {
											push([
												'new-bridge',
												literal<Bridge>({
													id: 'new-bridge',
													name: 'New Bridge',
													outgoing: true,
													url: 'ws://localhost:5401',
													settings: {
														devices: {
															casparcg0: literal<DeviceOptionsCasparCG>({
																type: DeviceType.CASPARCG,
																options: { host: '127.0.0.1', port: 5250 },
															}),
														},
													},
												}),
											])
										}}
									>
										Add Bridge
									</Button>
								</div>
							)}
						</FieldArray>

						<hr />

						<Button
							type="submit"
							color="primary"
							variant="contained"
							fullWidth
							disabled={formik.isSubmitting}
						>
							Save
						</Button>
					</Form>
				)}
			</Formik>

			{bridgeIdForEditDevices && (
				<Dialog open={devicesOpen} onClose={handleDevicesClose}>
					<DialogTitle>Devices for Bridge &quot;{bridgeIdForEditDevices}&quot;</DialogTitle>
					<DialogContent className="devices-dialog">
						<DevicesSettings project={project} bridgeId={bridgeIdForEditDevices} />
					</DialogContent>
					<DialogActions>
						<Button variant="contained" onClick={handleDevicesClose}>
							Close
						</Button>
					</DialogActions>
				</Dialog>
			)}
		</>
	)
}
