import { ErrorMessage, Field, Form, Formik } from 'formik'
import React, { ReactText, useContext, useRef } from 'react'
import { toast } from 'react-toastify'
import { Project } from '../../../models/project/Project'
import { IPCServerContext } from '../../contexts/IPCServer'
import { DataRow, FormRow } from '../sidebar/InfoGroup'

type ProjectFormValues = {
	name: Project['name']
}

export const ProjectSettings: React.FC<{ project: Project }> = ({ project }) => {
	const ipcServer = useContext(IPCServerContext)
	const toastId = useRef<ReactText>()
	const initialValues: ProjectFormValues = {
		name: project.name,
	}

	const notify = () => (toastId.current = toast('Saving Project Settings...', { autoClose: false }))
	const updateSuccess = () => {
		if (toastId.current) {
			toast.update(toastId.current, {
				render: 'Project Settings saved! ✓',
				type: toast.TYPE.SUCCESS,
				autoClose: 5000,
			})
		}
	}
	const updateFail = (message: string) => {
		if (toastId.current) {
			toast.update(toastId.current, {
				render: `Error when saving Project Settings: ${message}`,
				type: toast.TYPE.ERROR,
				autoClose: 5000,
			})
		}
	}

	return (
		<>
			<DataRow label="ID" value={project.id} />

			<Formik
				initialValues={initialValues}
				enableReinitialize={true}
				onSubmit={async (values, actions) => {
					notify()
					const editedProject: Project = {
						...project,
						name: values.name,
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
						<div className="form-body">
							<FormRow>
								<label htmlFor="projectName">Project Name</label>
								<Field id="projectName" name="name" type="text" placeholder="Name" />
								<ErrorMessage name="name" component="div" />
							</FormRow>
						</div>

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
