import React, { useContext, useState } from 'react'
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	IconButton,
	Radio,
} from '@mui/material'
import { MdSettings } from 'react-icons/md'
import { Field, Form, Formik } from 'formik'
import { TextField, RadioGroup } from 'formik-mui'
import * as Yup from 'yup'
import { IPCServerContext } from '../../contexts/IPCServer'
import { ErrorHandlerContext } from '../../contexts/ErrorHandler'
import { store } from '../../mobx/store'
import { observer } from 'mobx-react-lite'
import { DeviceStatuses } from './deviceStatuses/DeviceStatuses'
import { Tabs } from './tabs/Tabs'

const newRundownValidationSchema = Yup.object({
	name: Yup.string().label('Rundown Name').required(),
})

const renameRundownValidationSchema = Yup.object({
	name: Yup.string().label('Rundown Name').required(),
})

export const HeaderBar: React.FC<{
	onSettingsClick: () => void
}> = observer(({ onSettingsClick }) => {
	const serverAPI = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const [openRundownOpen, setOpenRundownOpen] = useState(false)
	const [newRundownOpen, setNewRundownOpen] = useState(false)
	const [renameRundownOpen, setRenameRundownOpen] = useState(false)
	const [rundownToRename, setRundownToRename] = useState<{ rundownId: string; name: string }>()

	const rundownsStore = store.rundownsStore

	const handleOpen = (rundownId: string) => {
		serverAPI.openRundown({ rundownId }).catch(handleError)
	}
	const handleCreate = (rundownName: string) => {
		serverAPI.newRundown({ name: rundownName }).catch(handleError)
	}
	const handleRename = (rundownId: string, newName: string) => {
		serverAPI.renameRundown({ rundownId, newName }).catch(handleError)
	}

	const handleOpenRundownClose = () => {
		setOpenRundownOpen(false)
		setNewRundownOpen(false)
	}

	const handleNewRundownClose = () => {
		setOpenRundownOpen(false)
		setNewRundownOpen(false)
	}

	const handleRenameRundownClose = () => {
		setRenameRundownOpen(false)
	}

	return (
		<div className="header-bar">
			<Tabs
				onNewRundownClick={() => {
					if (rundownsStore.closedRundowns && rundownsStore.closedRundowns.length > 0) {
						setOpenRundownOpen(true)
					} else {
						setNewRundownOpen(true)
					}
				}}
				onTabDoubleClick={(rundown) => {
					setRundownToRename(rundown)
					setRenameRundownOpen(true)
				}}
			/>

			<DeviceStatuses />

			<IconButton title="Open Preferences" aria-label="open preferences" onClick={onSettingsClick}>
				<MdSettings />
			</IconButton>

			{/* Open Rundown dialog */}
			<Formik
				initialValues={{
					rundownId: rundownsStore.closedRundowns.length > 0 ? rundownsStore.closedRundowns[0].rundownId : '',
				}}
				onSubmit={(values, actions) => {
					handleOpen(values.rundownId)
					handleOpenRundownClose()
					actions.setSubmitting(false)
					actions.resetForm()
				}}
			>
				{(formik) => {
					return (
						<Dialog open={openRundownOpen} onClose={handleOpenRundownClose}>
							<DialogTitle>Open Rundown</DialogTitle>
							<DialogContent>
								<Form>
									<Field component={RadioGroup} name="rundownId">
										{rundownsStore.closedRundowns &&
											rundownsStore.closedRundowns.map((rundown) => (
												<FormControlLabel
													key={rundown.rundownId}
													value={rundown.rundownId}
													control={<Radio disabled={formik.isSubmitting} />}
													label={rundown.name}
													disabled={formik.isSubmitting}
												/>
											))}
									</Field>
								</Form>
							</DialogContent>
							<DialogActions>
								<Button
									variant="contained"
									onClick={() => {
										setNewRundownOpen(true)
									}}
								>
									New Rundown
								</Button>
								<Button
									variant="contained"
									onClick={() => {
										formik.submitForm().catch(handleError)
									}}
								>
									Open
								</Button>
								<Button variant="contained" onClick={handleOpenRundownClose}>
									Close
								</Button>
							</DialogActions>
						</Dialog>
					)
				}}
			</Formik>

			{/* New Rundown dialog */}
			<Formik
				initialValues={{ name: 'New Rundown' }}
				validationSchema={newRundownValidationSchema}
				enableReinitialize={true}
				onSubmit={(values, actions) => {
					handleCreate(values.name)
					handleNewRundownClose()
					actions.setSubmitting(false)
					actions.resetForm()
				}}
			>
				{(formik) => {
					return (
						<Dialog open={newRundownOpen} onClose={handleNewRundownClose}>
							<DialogTitle>Create New Rundown</DialogTitle>
							<DialogContent>
								<Form>
									<Field
										component={TextField}
										margin="normal"
										fullWidth
										name="name"
										type="text"
										label="New Rundown Name"
										autoFocus
										required
									/>
								</Form>
							</DialogContent>
							<DialogActions>
								<Button variant="contained" onClick={handleNewRundownClose}>
									Cancel
								</Button>
								<Button
									variant="contained"
									onClick={() => {
										formik.submitForm().catch(handleError)
									}}
								>
									Create
								</Button>
							</DialogActions>
						</Dialog>
					)
				}}
			</Formik>

			{/* Rename Rundown dialog */}
			<Formik
				initialValues={{ name: rundownToRename?.name ?? '' }}
				validationSchema={renameRundownValidationSchema}
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
