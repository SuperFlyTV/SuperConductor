import React, { useEffect, useRef, useState } from 'react'
import { AppModel } from '@/models/AppModel'
import { Popup } from '../popup/Popup'
import { ErrorMessage, Field, Form, Formik, FormikProps } from 'formik'
import { FormRow } from '../sidebar/DataRow'
import { INewGroup, INewRundown, NEW_GROUP_CHANNEL, NEW_RUNDOWN_CHANNEL } from '@/ipc/channels'
import { GroupView } from './Group'
const { ipcRenderer } = window.require('electron')

export const GroupListView: React.FC<{
	appData: AppModel
	selectedTimelineObjId: string | undefined
}> = (props) => {
	return (
		<div className="group-list">
			{props.appData.groups.map((group, index) => {
				return <GroupView key={index} group={group} selectedTimelineObjId={props.selectedTimelineObjId} />
			})}

			<GroupListOptions />
		</div>
	)
}

const GroupListOptions: React.FC<{}> = () => {
	const [newRundownOpen, setNewRundownOpen] = useState(false)
	const [newGroupOpen, setNewGroupOpen] = useState(false)

	return (
		<>
			<div className="group-list__control-row">
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
								groupId: null,
							}

							ipcRenderer.send(NEW_RUNDOWN_CHANNEL, data)
							setNewRundownOpen(false)
						}}
					>
						{(formik) => (
							<Form>
								<FormRow>
									<label htmlFor="name">Name</label>
									<Field id="name" name="name" placeholder="Rundown name" autoFocus={true} />
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
							}

							ipcRenderer.send(NEW_GROUP_CHANNEL, data)

							setNewGroupOpen(false)
						}}
					>
						{(formik) => (
							<Form>
								<FormRow>
									<label htmlFor="name">Name</label>
									<Field id="name" name="name" placeholder="Group name" autoFocus={true} />
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
