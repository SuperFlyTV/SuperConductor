import React, { useContext, useState } from 'react'
import { AppModel } from '@/models/AppModel'
import { Popup } from '../popup/Popup'
import { ErrorMessage, Field, Form, Formik } from 'formik'
import { FormRow } from '../sidebar/DataRow'
import { GroupView } from './GroupView'
import { IPCServerContext } from '@/react/App'

export const GroupListView: React.FC<{
	appData: AppModel
}> = (props) => {
	return (
		<div className="group-list">
			{props.appData.groups.map((group, index) => {
				return <GroupView key={index} group={group} />
			})}

			<GroupListOptions />
		</div>
	)
}

const GroupListOptions: React.FC<{}> = () => {
	const ipcServer = useContext(IPCServerContext)
	const [newPartOpen, setNewPartOpen] = useState(false)
	const [newGroupOpen, setNewGroupOpen] = useState(false)

	return (
		<>
			<div className="group-list__control-row">
				<button className="btn form" onClick={() => setNewPartOpen(true)}>
					New part
				</button>
				<button className="btn form" onClick={() => setNewGroupOpen(true)}>
					New group
				</button>
			</div>
			{newPartOpen && (
				<Popup onClose={() => setNewPartOpen(false)}>
					<Formik
						initialValues={{ name: '' }}
						enableReinitialize={true}
						onSubmit={(values, actions) => {
							ipcServer.newPart({
								name: values.name,
								groupId: null,
							})
							setNewPartOpen(false)
						}}
					>
						{(formik) => (
							<Form>
								<FormRow>
									<label htmlFor="name">Name</label>
									<Field id="name" name="name" placeholder="Part name" autoFocus={true} />
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
						onSubmit={(values, _actions) => {
							ipcServer.newGroup({
								name: values.name,
							})

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
