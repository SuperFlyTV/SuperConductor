import React, { useContext, useState } from 'react'
import { AppModel } from '@/models/AppModel'
import { Popup } from '../popup/Popup'
import { ErrorMessage, Field, Form, Formik } from 'formik'
import { FormRow } from '../sidebar/DataRow'
import { GroupView } from './Group'
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
							ipcServer.newRundown({
								name: values.name,
								groupId: null,
							})
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
