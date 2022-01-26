import { ErrorMessage, Field, Form, Formik } from 'formik'
import React, { useContext } from 'react'
import { Project } from '../../../models/project/Project'
import { IPCServerContext } from '../../contexts/IPCServer'
import { DataRow, FormRow } from '../sidebar/InfoGroup'

type ProjectFormValues = {
	name: Project['name']
}

export const ProjectSettings: React.FC<{ project: Project }> = ({ project }) => {
	const ipcServer = useContext(IPCServerContext)
	const initialValues: ProjectFormValues = {
		name: project.name,
	}

	return (
		<>
			<DataRow label="ID" value={project.id} />

			<Formik
				initialValues={initialValues}
				enableReinitialize={true}
				onSubmit={async (values, actions) => {
					const editedProject: Project = {
						...project,
						name: values.name,
					}
					try {
						await ipcServer.updateProject({ id: editedProject.id, project: editedProject })
					} catch (error) {
						console.error(error)
					}
					actions.setSubmitting(false)
				}}
			>
				{() => (
					<Form>
						<div className="form-body">
							<FormRow>
								<label htmlFor="projectName">Project Name</label>
								<Field id="projectName" name="name" type="text" placeholder="Name" />
								<ErrorMessage name="name" component="div" />
							</FormRow>
						</div>

						<div className="btn-row-equal">
							<button type="submit" className="btn form">
								Save
							</button>
						</div>
					</Form>
				)}
			</Formik>
		</>
	)
}
