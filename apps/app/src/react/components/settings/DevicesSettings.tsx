import { deepClone } from '@shared/lib'
import { Field, FieldArray, Form, Formik } from 'formik'
import React, { useContext } from 'react'
import { DeviceOptionsAny, DeviceOptionsCasparCG, DeviceType } from 'timeline-state-resolver-types'
import { literal } from '@shared/lib'
import { Project } from '../../../models/project/Project'
import { IPCServerContext } from '../../contexts/IPCServer'
import { useSnackbar } from 'notistack'
import { TextField } from 'formik-mui'
import * as Yup from 'yup'
import { Button, Grid, MenuItem } from '@mui/material'

const MAX_PORT = 65535

type DevicesFormValues = {
	devices: Array<[string, DeviceOptionsAny]>
}

const validationSchema = Yup.object({
	devices: Yup.array().of(
		Yup.tuple([
			Yup.string().label('ID').required(),
			Yup.object({
				type: Yup.string().label('Device Type').required(),
				options: Yup.object({
					host: Yup.string().label('Device Host').required(),
					port: Yup.number()
						.label('Device Port')
						.required()
						.integer()
						.moreThan(0)
						.lessThan(MAX_PORT + 1),
				}),
			}),
		])
	),
})

export const DevicesSettings: React.FC<{ project: Project; bridgeId: string }> = ({ project, bridgeId }) => {
	const ipcServer = useContext(IPCServerContext)
	const { enqueueSnackbar } = useSnackbar()

	const bridge = project.bridges[bridgeId]
	const initialValues: DevicesFormValues = {
		devices: Object.entries(deepClone(bridge.settings.devices)),
	}

	return (
		<Formik
			initialValues={initialValues}
			validationSchema={validationSchema}
			enableReinitialize={true}
			onSubmit={async (values, actions) => {
				enqueueSnackbar('Saving Devices...', { variant: 'info' })
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
					enqueueSnackbar('Devices saved!', { variant: 'success' })
				} catch (error) {
					console.error(error)
					enqueueSnackbar(`Error when saving Devices: ${(error as any).message}`, {
						variant: 'error',
					})
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
										<Field
											component={TextField}
											margin="normal"
											fullWidth
											name={`devices.${index}.0`}
											type="text"
											label="Device ID"
										/>

										<Field
											component={TextField}
											select
											margin="normal"
											fullWidth
											name={`devices.${index}.1.type`}
											label="Device Type"
										>
											<MenuItem value={DeviceType.CASPARCG}>CasparCG</MenuItem>
											<MenuItem value={DeviceType.ATEM}>ATEM</MenuItem>
										</Field>

										<Grid container spacing={2}>
											<Grid item xs={6}>
												<Field
													component={TextField}
													margin="normal"
													fullWidth
													name={`devices.${index}.1.options.host`}
													type="text"
													label="Device Host"
												/>
											</Grid>
											<Grid item xs={6}>
												<Field
													component={TextField}
													margin="normal"
													fullWidth
													name={`devices.${index}.1.options.port`}
													type="number"
													label="Device Port"
													inputProps={{ min: 1, max: MAX_PORT }}
												/>
											</Grid>
										</Grid>

										<Button
											color="error"
											variant="contained"
											fullWidth
											onClick={() => {
												remove(index)
											}}
										>
											Remove Device
										</Button>

										<hr />
									</React.Fragment>
								))}

								<Button
									color="info"
									variant="contained"
									fullWidth
									onClick={() => {
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
									}}
								>
									Add Device
								</Button>
							</div>
						)}
					</FieldArray>

					<hr />

					<Button type="submit" color="primary" variant="contained" fullWidth disabled={formik.isSubmitting}>
						Save
					</Button>
				</Form>
			)}
		</Formik>
	)
}
