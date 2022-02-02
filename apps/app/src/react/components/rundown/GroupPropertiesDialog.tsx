import React from 'react'
import { Field, Form, Formik } from 'formik'
import * as Yup from 'yup'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import { TextField } from 'formik-mui'
import { Group } from '../../../models/rundown/Group'

interface IProps {
	initial?: Group
	open: boolean
	onAccepted: (newGroup: Partial<Group> & Pick<Group, 'name'>) => void
	onDiscarded: () => void
	acceptLabel: string
	title: string
}

const groupValidationSchema = Yup.object({
	name: Yup.string().label('Group Name').required(),
})

export function GroupPropertiesDialog({ initial, open, title, acceptLabel, onAccepted, onDiscarded }: IProps) {
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
				<Dialog open={open}>
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
						<Button
							onClick={() => {
								formik.submitForm().catch(console.error)
							}}
						>
							{acceptLabel}
						</Button>
						<Button onClick={onDiscarded}>Cancel</Button>
					</DialogActions>
				</Dialog>
			)}
		</Formik>
	)
}
