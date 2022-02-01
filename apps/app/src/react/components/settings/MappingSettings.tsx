import { deepClone } from '@shared/lib'
import { Field, FieldArray, Form, Formik } from 'formik'
import React, { useContext } from 'react'
import { DeviceType, MappingCasparCG } from 'timeline-state-resolver-types'
import { literal } from '@shared/lib'
import { Project } from '../../../models/project/Project'
import { IPCServerContext } from '../../contexts/IPCServer'
import { Button, Grid, MenuItem } from '@mui/material'
import * as Yup from 'yup'
import { TextField } from 'formik-mui'
import { useSnackbar } from 'notistack'

type MappingsFormValues = {
	mappings: Array<[string, MappingCasparCG]>
}

const validationSchema = Yup.object({
	mappings: Yup.array().of(
		Yup.tuple([
			Yup.string().label('ID').required(),
			Yup.object({
				device: Yup.number().label('Device').required(),
				deviceId: Yup.string().label('Device ID').required(),
				layerName: Yup.string().label('Mapping Name').required(),
				channel: Yup.number().label('Channel').required().integer().moreThan(0),
				layer: Yup.number().label('Layer').required().integer().moreThan(0),
			}),
		])
	),
})

export const MappingSettings: React.FC<{ project: Project }> = ({ project }) => {
	const ipcServer = useContext(IPCServerContext)
	const { enqueueSnackbar } = useSnackbar()

	const initialValues: MappingsFormValues = {
		mappings: Object.entries(deepClone(project.mappings as any)),
	}

	return (
		<Formik
			initialValues={initialValues}
			enableReinitialize={true}
			validationSchema={validationSchema}
			onSubmit={async (values, actions) => {
				enqueueSnackbar('Saving Mappings...', { variant: 'info' })
				const editedMappings = Object.fromEntries(values.mappings)
				const editedProject: Project = {
					...project,
					mappings: editedMappings,
				}
				try {
					await ipcServer.updateProject({ id: editedProject.id, project: editedProject })
					enqueueSnackbar('Mappings saved!', { variant: 'success' })
				} catch (error) {
					console.error(error)
					enqueueSnackbar(`Error when saving Mappings: ${(error as any).message}`, {
						variant: 'error',
					})
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
										<Field
											component={TextField}
											margin="normal"
											fullWidth
											name={`mappings.${index}.0`}
											type="text"
											label="Mapping ID"
										/>

										<Field
											component={TextField}
											margin="normal"
											fullWidth
											name={`mappings.${index}.1.layerName`}
											type="text"
											label="Mapping Name"
										/>

										<Field
											component={TextField}
											select
											margin="normal"
											fullWidth
											name={`mappings.${index}.1.deviceId`}
											label="Device ID"
										>
											{listAvailableDeviceIDs(project.bridges).map((deviceId) => (
												<MenuItem key={deviceId} value={deviceId}>
													{deviceId}
												</MenuItem>
											))}
										</Field>

										<Grid container spacing={2}>
											<Grid item xs={6}>
												<Field
													component={TextField}
													margin="normal"
													fullWidth
													name={`mappings.${index}.1.channel`}
													type="number"
													label="Channel"
													inputProps={{ min: 1 }}
												/>
											</Grid>
											<Grid item xs={6}>
												<Field
													component={TextField}
													margin="normal"
													fullWidth
													name={`mappings.${index}.1.layer`}
													type="number"
													label="Layer"
													inputProps={{ min: 1 }}
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
											Remove Mapping
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
											'new-mapping',
											literal<MappingCasparCG>({
												device: DeviceType.CASPARCG,
												deviceId: 'casparcg0',
												layerName: 'New Mapping',
												channel: 1,
												layer: 10,
											}),
										])
									}}
								>
									Add Mapping
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
