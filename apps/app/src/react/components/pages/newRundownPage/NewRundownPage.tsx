import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import { Field, Form, Formik } from 'formik'
import React, { useContext, useState } from 'react'
import { IPCServerContext } from '../../../contexts/IPCServer'
import { ImportRundownIcon } from './ImportRundownIcon'
import { NewGroupIcon } from './NewGropIcon'
import { NewRundownOption } from './NewRundownOption'
import * as Yup from 'yup'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler'
import { TextField } from 'formik-mui'
import { store } from '../../../mobx/store'

import './newRundownPage.scss'

export const NewRundownPage = () => {
	const serverAPI = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const rundownsStore = store.rundownsStore

	const [newRundownOpen, setNewRundownOpen] = useState(false)

	const handleCreateNewRundown = (rundownName: string) => {
		serverAPI.newRundown({ name: rundownName }).catch(handleError)
	}

	const handleCloseCreateNewRundown = () => setNewRundownOpen(false)

	const defaultName = rundownsStore.rundowns ? `Rundown${Object.keys(rundownsStore.rundowns).length}` : 'Rundown0'

	return (
		<div className="new-rundown-page">
			<div className="title">Create New Rundown</div>
			<div className="options">
				<NewRundownOption
					label="Empty Rundown"
					icon={<NewGroupIcon />}
					onClick={() => {
						setNewRundownOpen(true)
					}}
				/>
				<NewRundownOption
					label="Import Rundown From Another Project"
					icon={<ImportRundownIcon />}
					onClick={() => {
						alert('This feature is not implemented yet.')
					}}
				/>
			</div>

			{/* New Rundown dialog */}
			<Formik
				initialValues={{ name: defaultName }}
				validationSchema={Yup.object({
					name: Yup.string().label('Rundown Name').required(),
				})}
				enableReinitialize={true}
				onSubmit={(values, actions) => {
					handleCreateNewRundown(values.name)
					handleCloseCreateNewRundown()
					actions.setSubmitting(false)
					actions.resetForm()
				}}
			>
				{(formik) => {
					return (
						<Dialog open={newRundownOpen} onClose={handleCloseCreateNewRundown}>
							<DialogTitle>Create New Rundown</DialogTitle>
							<DialogContent>
								<Form>
									<Field
										component={TextField}
										margin="normal"
										fullWidth
										name="name"
										type="text"
										label="New Rundown Name"
										autoFocus
										required
									/>
								</Form>
							</DialogContent>
							<DialogActions>
								<Button
									variant="contained"
									onClick={() => {
										formik.resetForm()
										handleCloseCreateNewRundown()
									}}
								>
									Cancel
								</Button>
								<Button
									variant="contained"
									onClick={() => {
										formik.submitForm().catch(handleError)
									}}
								>
									Create
								</Button>
							</DialogActions>
						</Dialog>
					)
				}}
			</Formik>
		</div>
	)
}
