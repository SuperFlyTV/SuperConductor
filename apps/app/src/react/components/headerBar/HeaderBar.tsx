import React, { useContext, useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import { Field, Form, Formik } from 'formik'
import { TextField } from 'formik-mui'
import * as Yup from 'yup'
import { IPCServerContext } from '../../contexts/IPCServer.js'
import { ErrorHandlerContext } from '../../contexts/ErrorHandler.js'
import { observer } from 'mobx-react-lite'
import { DeviceStatuses } from './deviceStatuses/DeviceStatuses.js'
import { Tabs } from './tabs/Tabs.js'

import './style.scss'
import { store } from '../../mobx/store.js'

export const HeaderBar: React.FC = observer(function HeaderBar() {
	const serverAPI = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const [renameRundownOpen, setRenameRundownOpen] = useState(false)
	const [rundownToRename, setRundownToRename] = useState<{ rundownId: string; name: string }>()

	const handleRename = (rundownId: string, newName: string) => {
		serverAPI
			.renameRundown({ rundownId, newName })
			.then((newRundownId) => {
				setTimeout(() => {
					store.rundownsStore.setCurrentRundown(newRundownId)
				}, 100)
			})
			.catch(handleError)
		// store.guiStore.activeTabId
	}

	const handleRenameRundownClose = () => {
		setRenameRundownOpen(false)
	}

	return (
		<div className="header-bar">
			<Tabs
				onTabDoubleClick={(rundown) => {
					setRundownToRename(rundown)
					setRenameRundownOpen(true)
				}}
			/>

			<DeviceStatuses />

			{/* Rename Rundown dialog */}
			<Formik
				initialValues={{ name: rundownToRename?.name ?? '' }}
				validationSchema={Yup.object({
					name: Yup.string().label('Rundown Name').required(),
				})}
				enableReinitialize={true}
				onSubmit={(values, actions) => {
					if (rundownToRename) {
						handleRename(rundownToRename.rundownId, values.name)
					}
					handleRenameRundownClose()
					actions.setSubmitting(false)
					actions.resetForm()
				}}
			>
				{(formik) => {
					return (
						<Dialog open={renameRundownOpen} onClose={handleRenameRundownClose}>
							<DialogTitle>Rename Rundown</DialogTitle>
							<DialogContent>
								<Form>
									<Field
										component={TextField}
										margin="normal"
										fullWidth
										name="name"
										type="text"
										label="Rundown Name"
										autoFocus
										required
									/>
								</Form>
							</DialogContent>
							<DialogActions>
								<Button variant="contained" onClick={handleRenameRundownClose}>
									Cancel
								</Button>
								<Button
									variant="contained"
									onClick={() => {
										formik.submitForm().catch(handleError)
									}}
								>
									Rename
								</Button>
							</DialogActions>
						</Dialog>
					)
				}}
			</Formik>
		</div>
	)
})
