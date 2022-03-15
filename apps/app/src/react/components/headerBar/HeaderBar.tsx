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
import { ConnectionStatus } from '../util/ConnectionStatus'
import { store } from '../../mobx/store'
import { observer } from 'mobx-react-lite'
import { Tab } from './tabs/Tab'
import { NewTabBtn } from './tabs/NewTabBtn'

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

	const appStore = store.appStore
	const rundownsStore = store.rundownsStore

	const handleSelect = (rundownId: string) => {
		store.rundownsStore.setCurrentRundown(rundownId)
	}

	const handleClose = (rundownId: string) => {
		serverAPI.closeRundown({ rundownId }).catch(handleError)
		const nextRundown = rundownsStore.openRundowns.find((rd) => rd.rundownId !== rundownId)
		if (nextRundown) {
			store.rundownsStore.setCurrentRundown(nextRundown.rundownId)
		} else {
			store.rundownsStore.setCurrentRundown(undefined)
		}
	}

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
		<>
			{rundownsStore.openRundowns.map((rundown) => {
				return (
					<Tab
						key={rundown.rundownId}
						id={rundown.rundownId}
						name={rundown.name}
						selected={rundown.rundownId === rundownsStore.currentRundownId}
						onClick={() => handleSelect(rundown.rundownId)}
						onDoubleClick={() => {
							setRundownToRename(rundown)
							setRenameRundownOpen(true)
						}}
						onClose={(id) => handleClose(id)}
					/>
				)
			})}

			<NewTabBtn
				onClick={() => {
					if (rundownsStore.closedRundowns && rundownsStore.closedRundowns.length > 0) {
						setOpenRundownOpen(true)
					} else {
						setNewRundownOpen(true)
					}
				}}
			/>

			<div className="device-statuses">
				{Object.entries(appStore.bridgeStatuses).map(([bridgeId, bridgeStatus]) => {
					return Object.entries(bridgeStatus.devices).map(([deviceId, deviceStatus]) => {
						return (
							<ConnectionStatus
								key={`${bridgeId}_${deviceId}`}
								label={deviceId}
								tooltip={bridgeStatus.connected ? deviceStatus.message : 'Bridge is disconnected'}
								ok={bridgeStatus.connected && deviceStatus.ok}
							/>
						)
					})
				})}
				{Object.entries(appStore.peripherals).map(([peripheralId, peripheral]) => {
					const bridge = appStore.bridgeStatuses[peripheral.bridgeId]

					const bridgeIsConnected = bridge && bridge.connected

					return (
						<ConnectionStatus
							key={`${peripheralId}`}
							label={peripheral.name}
							tooltip={peripheral.status.connected ? 'Disconnected' : ''}
							ok={bridgeIsConnected && peripheral.status.connected}
						/>
					)
				})}
			</div>

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
		</>
	)
})
