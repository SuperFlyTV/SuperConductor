import { Button } from '@mui/material'
import { TextField } from 'formik-mui'
import { Field, Form, Formik } from 'formik'
import React, { useContext } from 'react'
import { Project } from '../../../models/project/Project'
import { IPCServerContext } from '../../contexts/IPCServer'
import * as Yup from 'yup'
import { useSnackbar } from 'notistack'

type ProjectFormValues = {
	id: Project['id']
	name: Project['name']
}

const validationSchema = Yup.object({
	id: Yup.string().label('ID').required(),
	name: Yup.string().label('Name').required(),
})

export const ProjectSettings: React.FC<{ project: Project }> = ({ project }) => {
	const ipcServer = useContext(IPCServerContext)
	const { enqueueSnackbar } = useSnackbar()

	const initialValues: ProjectFormValues = { id: project.id, name: project.name }

	return (
		<Formik
			initialValues={initialValues}
			enableReinitialize={true}
			validationSchema={validationSchema}
			onSubmit={async (values, actions) => {
				enqueueSnackbar('Saving Project Settings...', { variant: 'info' })
				const editedProject: Project = {
					...project,
					name: values.name,
				}
				try {
					await ipcServer.updateProject({ id: editedProject.id, project: editedProject })
					enqueueSnackbar('Project Settings saved!', { variant: 'success' })
				} catch (error) {
					console.error(error)
					enqueueSnackbar(`Error when saving Project Settings: ${(error as any).message}`, {
						variant: 'error',
					})
				}
				actions.setSubmitting(false)
			}}
		>
			{(formik) => (
				<Form>
					<div className="form-body">
						<Field
							component={TextField}
							margin="normal"
							fullWidth
							name="id"
							type="text"
							label="ID"
							disabled
						/>

						<Field component={TextField} margin="normal" fullWidth name="name" type="text" label="Name" />
					</div>

					<Button type="submit" color="primary" variant="contained" fullWidth disabled={formik.isSubmitting}>
						Save
					</Button>
				</Form>
			)}
		</Formik>
	)
}
