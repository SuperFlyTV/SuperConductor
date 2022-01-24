import React from 'react'
import { ErrorMessage, Field, Form, Formik } from 'formik'
import { Popup } from '../../popup/Popup'
import { FormRow } from '../../sidebar/InfoGroup'
import { Part } from '@/models/rundown/Part'

interface IProps {
	initial?: Part
	onAccepted: (newPart: Partial<Part> & Pick<Part, 'name'>) => void
	onDiscarded: () => void
	acceptLabel?: string
}

export function PartPropertiesDialog({ initial, acceptLabel, onAccepted, onDiscarded }: IProps) {
	return (
		<Popup onClose={onDiscarded}>
			<Formik
				initialValues={{ name: initial?.name ?? '' }}
				enableReinitialize={true}
				onSubmit={(values) => {
					onAccepted({
						name: values.name,
					})
				}}
			>
				{() => (
					<Form>
						<FormRow>
							<label htmlFor="name">Name</label>
							<Field id="name" name="name" placeholder="Part name" autoFocus={true} />
							<ErrorMessage name="name" component="div" />
						</FormRow>
						<div className="btn-row-right">
							<button type="submit" className="btn form">
								{acceptLabel ?? 'OK'}
							</button>
						</div>
					</Form>
				)}
			</Formik>
		</Popup>
	)
}
