import React, { useState } from 'react'
import { AppModel, Rundowns } from '@/models/AppModel'
import { Rundown } from '../rundown/Rundown'
import { Popup } from '../popup/Popup'
import { ErrorMessage, Field, Form, Formik } from 'formik'
import { FormRow } from '../sidebar/DataRow'
import { NEW_RUNDOWN_CHANNEL } from '@/ipc/channels'
const { ipcRenderer } = window.require('electron')

type PropsType = {
	appData: AppModel
	selectedTimelineObjId?: string
}

const Rundowns = (props: PropsType) => {
	const [newRundownOpen, setNewRundownOpen] = useState(false)

	return (
		<div className="rundowns">
			{props.appData.rundowns.map((rdOrGroup, idx) => {
				if (rdOrGroup.type === 'rundown') {
					return (
						<Rundown
							key={idx}
							name={rdOrGroup.name}
							timeline={rdOrGroup.timeline}
							selectedTimelineObjId={props.selectedTimelineObjId}
						/>
					)
				} else {
					// Recursively show rundowns and groups
				}
			})}
			<button className="btn form" onClick={() => setNewRundownOpen(true)}>
				New rundown
			</button>

			{newRundownOpen && (
				<Popup onClose={() => setNewRundownOpen(false)}>
					<Formik
						initialValues={{ name: '' }}
						enableReinitialize={true}
						onSubmit={(values, actions) => {
							ipcRenderer.send(NEW_RUNDOWN_CHANNEL, { name: values.name })
							setNewRundownOpen(false)
						}}
					>
						{(formik) => (
							<Form>
								<FormRow>
									<label htmlFor="name">Name</label>
									<Field id="name" name="name" placeholder="Rundown name" />
									<ErrorMessage name="name" component="div" />
								</FormRow>
								<div className="btn-row-right">
									<button type="submit" className="btn form">
										Create
									</button>
								</div>
							</Form>
						)}
					</Formik>
				</Popup>
			)}
		</div>
	)
}

export default Rundowns
