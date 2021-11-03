import React, { useState } from 'react'
import { AppModel, Rundowns } from '@/models/AppModel'
import { Rundown } from './Rundown'
import { Popup } from '../popup/Popup'
import { ErrorMessage, Field, Form, Formik } from 'formik'
import { FormRow } from '../sidebar/DataRow'
import { NEW_RUNDOWN_CHANNEL } from '@/ipc/channels'
import { Group } from './Group'
const { ipcRenderer } = window.require('electron')

const RundownsItems = ({ rundowns, selectedTimelineObjId }: { rundowns: Rundowns; selectedTimelineObjId?: string }) => {
	return (
		<div className="rundown-items">
			{rundowns.map((rdOrGroup, idx) => {
				if (rdOrGroup.type === 'rundown') {
					return (
						<Rundown
							key={idx}
							id={rdOrGroup.id}
							name={rdOrGroup.name}
							timeline={rdOrGroup.timeline}
							selectedTimelineObjId={selectedTimelineObjId}
						/>
					)
				} else {
					// Recursively show rundowns and groups
					return (
						<Group key={idx} loop={rdOrGroup.loop} id={rdOrGroup.id}>
							<RundownsItems rundowns={rdOrGroup.rundowns} selectedTimelineObjId={selectedTimelineObjId} />
						</Group>
					)
				}
			})}
		</div>
	)
}

type PropsType = {
	appData: AppModel
	selectedTimelineObjId?: string
}

const Rundowns = (props: PropsType) => {
	const [newRundownOpen, setNewRundownOpen] = useState(false)

	return (
		<div className="rundowns">
			<RundownsItems rundowns={props.appData.rundowns} selectedTimelineObjId={props.selectedTimelineObjId} />

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
