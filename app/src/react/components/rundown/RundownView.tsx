import React, { useContext, useState } from 'react'
import { Popup } from '../popup/Popup'
import { ErrorMessage, Field, Form, Formik } from 'formik'
import { GroupView } from './GroupView/GroupView'
import { RundownContext } from '@/react/contexts/Rundown'
import { IPCServerContext } from '@/react/contexts/IPCServer'
import { Rundown } from '@/models/rundown/Rundown'
import { FormRow } from '../sidebar/InfoGroup'

export const RundownView: React.FC<{}> = (props) => {
	const rundown = useContext(RundownContext)

	return (
		<div className="group-list">
			{rundown.groups.map((group, index) => {
				return <GroupView key={index} group={group} rundownId={rundown.id} />
			})}

			<GroupListOptions rundown={rundown} />
		</div>
	)
}

const GroupListOptions: React.FC<{ rundown: Rundown }> = ({ rundown }) => {
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
								rundownId: rundown.id,
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
								rundownId: rundown.id,
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
