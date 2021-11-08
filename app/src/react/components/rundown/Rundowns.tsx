import React, { useState } from 'react'
import { AppModel, RundownOrGroupModel } from '@/models/AppModel'
import { Rundown } from './Rundown'
import { Popup } from '../popup/Popup'
import { ErrorMessage, Field, Form, Formik } from 'formik'
import { FormRow } from '../sidebar/DataRow'
import { INewGroup, INewRundown, NEW_GROUP_CHANNEL, NEW_RUNDOWN_CHANNEL } from '@/ipc/channels'
import { Group } from './Group'
import { GroupModel } from '@/models/GroupModel'
const { ipcRenderer } = window.require('electron')

const RundownsItems = ({
	rundowns,
	selectedTimelineObjId,
	group,
}: {
	rundowns: RundownOrGroupModel[]
	selectedTimelineObjId?: string
	group?: GroupModel
}) => {
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
							group={group}
						/>
					)
				} else {
					// Recursively show rundowns and groups
					return (
						<Group key={idx} loop={rdOrGroup.loop} id={rdOrGroup.id}>
							<RundownsItems
								group={rdOrGroup}
								rundowns={rdOrGroup.rundowns}
								selectedTimelineObjId={selectedTimelineObjId}
							/>

							<NewRundownOptions groupId={rdOrGroup.id} />
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
	return (
		<div className="rundowns">
			<RundownsItems rundowns={props.appData.rundowns} selectedTimelineObjId={props.selectedTimelineObjId} />

			<NewRundownOptions />
		</div>
	)
}

export default Rundowns

interface NewRundownOptionsProps {
	groupId?: string
}

const NewRundownOptions = (props: NewRundownOptionsProps) => {
	const [newRundownOpen, setNewRundownOpen] = useState(false)
	const [newGroupOpen, setNewGroupOpen] = useState(false)

	return (
		<>
			<div className="rundowns-control-row">
				<button className="btn form" onClick={() => setNewRundownOpen(true)}>
					New rundown
				</button>
				<button className="btn form" onClick={() => setNewGroupOpen(true)}>
					New group
				</button>
			</div>
			{newRundownOpen && (
				<Popup onClose={() => setNewRundownOpen(false)}>
					<Formik
						initialValues={{ name: '' }}
						enableReinitialize={true}
						onSubmit={(values, actions) => {
							const data: INewRundown = {
								name: values.name,
								groupId: props.groupId,
							}

							ipcRenderer.send(NEW_RUNDOWN_CHANNEL, data)
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

			{newGroupOpen && (
				<Popup onClose={() => setNewGroupOpen(false)}>
					<Formik
						initialValues={{ name: '' }}
						enableReinitialize={true}
						onSubmit={(values, actions) => {
							const data: INewGroup = {
								name: values.name,
								groupId: props.groupId,
							}

							ipcRenderer.send(NEW_GROUP_CHANNEL, data)

							setNewGroupOpen(false)
						}}
					>
						{(formik) => (
							<Form>
								<FormRow>
									<label htmlFor="name">Name</label>
									<Field id="name" name="name" placeholder="Group name" />
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
		</>
	)
}
