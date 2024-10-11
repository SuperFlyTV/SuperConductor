import React, { useContext } from 'react'
import { Field, Form, Formik } from 'formik'
import * as Yup from 'yup'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import { TextField } from 'formik-mui'
import { Group } from '../../../models/rundown/Group.js'
import { ErrorHandlerContext } from '../../contexts/ErrorHandler.js'

interface IProps {
	initial?: Partial<Group>
	open: boolean
	onAccepted: (newGroup: Partial<Group> & Pick<Group, 'name'>) => void
	onDiscarded: () => void
	acceptLabel: string
	title: string
}

const groupValidationSchema = Yup.object({
	name: Yup.string().label('Group Name').required(),
})

export function GroupPropertiesDialog({
	initial,
	open,
	title,
	acceptLabel,
	onAccepted,
	onDiscarded,
}: IProps): JSX.Element {
	const { handleError } = useContext(ErrorHandlerContext)

	return (
		<Formik
			initialValues={{ name: initial?.name ?? '' }}
			validationSchema={groupValidationSchema}
			enableReinitialize={true}
			onSubmit={(values, actions) => {
				onAccepted({
					name: values.name,
				})
				actions.setSubmitting(false)
				actions.resetForm()
			}}
		>
			{(formik) => (
				<Dialog open={open} onClose={onDiscarded}>
					<DialogTitle>{title}</DialogTitle>
					<DialogContent>
						<Form>
							<Field
								component={TextField}
								margin="normal"
								fullWidth
								name="name"
								type="text"
								label="Group Name"
								autoFocus={true}
								required
							/>
						</Form>
					</DialogContent>
					<DialogActions>
						<Button variant="contained" onClick={onDiscarded}>
							Cancel
						</Button>
						<Button
							variant="contained"
							onClick={() => {
								formik.submitForm().catch(handleError)
							}}
						>
							{acceptLabel}
						</Button>
					</DialogActions>
				</Dialog>
			)}
		</Formik>
	)
}
