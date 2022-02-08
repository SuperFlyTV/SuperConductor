import { BridgeStatus } from '../../../models/project/Bridge'
import { Peripheral } from '../../../models/project/Peripheral'
import classNames from 'classnames'
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
import { MdAdd, MdClose, MdSettings } from 'react-icons/md'
import { Field, Form, Formik } from 'formik'
import { TextField, RadioGroup } from 'formik-mui'
import * as Yup from 'yup'
import { ErrorHandlerContext } from '../../contexts/ErrorHandler'

const newRundownValidationSchema = Yup.object({
	name: Yup.string().label('Rundown Name').required(),
})

const renameRundownValidationSchema = Yup.object({
	name: Yup.string().label('Rundown Name').required(),
})

export const TopHeader: React.FC<{
	selectedRundownId?: string
	openRundowns: { rundownId: string; name: string }[]
	closedRundowns: { rundownId: string; name: string }[]
	bridgeStatuses: { [bridgeId: string]: BridgeStatus }
	peripherals: { [peripheralId: string]: Peripheral }
	onSelect: (rundownId: string) => void
	onClose: (rundownId: string) => void
	onOpen: (rundownId: string) => void
	onCreate: (rundownName: string) => void
	onRename: (rundownId: string, newName: string) => void
	onSettingsClick: () => void
}> = ({
	selectedRundownId,
	openRundowns,
	closedRundowns,
	bridgeStatuses,
	peripherals,
	onSelect,
	onClose,
	onOpen,
	onCreate,
	onRename,
	onSettingsClick,
}) => {
	const { handleError } = useContext(ErrorHandlerContext)
	const [openRundownOpen, setOpenRundownOpen] = useState(false)
	const [newRundownOpen, setNewRundownOpen] = useState(false)
	const [renameRundownOpen, setRenameRundownOpen] = useState(false)
	const [rundownToRename, setRundownToRename] = useState<{ rundownId: string; name: string }>()

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
			{openRundowns.map((rundown) => {
				return (
					<div
						key={rundown.rundownId}
						className={classNames('tab', { 'tab--selected': rundown.rundownId === selectedRundownId })}
						onClick={() => {
							onSelect(rundown.rundownId)
						}}
						onDoubleClick={() => {
							setRundownToRename(rundown)
							setRenameRundownOpen(true)
						}}
					>
						{rundown.name}

						<IconButton
							color="error"
							title="Close Rundown"
							aria-label="close rundown"
							onClick={(event) => {
								onClose(rundown.rundownId)
								event.stopPropagation()
								event.preventDefault()
							}}
						>
							<MdClose />
						</IconButton>
					</div>
				)
			})}

			<IconButton
				color="primary"
				title="Create/Open Rundown"
				aria-label="open or create new rundown"
				onClick={() => {
					if (closedRundowns && closedRundowns.length > 0) {
						setOpenRundownOpen(true)
					} else {
						setNewRundownOpen(true)
					}
				}}
			>
				<MdAdd />
			</IconButton>

			{Object.entries(bridgeStatuses).map(([bridgeId, bridgeStatus]) => {
				return Object.entries(bridgeStatus.devices).map(([deviceId, deviceStatus]) => {
					return (
						<div
							key={`${bridgeId}_${deviceId}`}
							className={classNames('device-status', { ok: bridgeStatus.connected && deviceStatus.ok })}
							title={bridgeStatus.connected ? deviceStatus.message : 'Bridge is disconnected'}
						>
							{deviceId}

							<div className="device-status__dot"></div>
						</div>
					)
				})
			})}
			{Object.entries(peripherals).map(([peripheralId, peripheral]) => {
				return (
					<div
						key={`${peripheralId}`}
						className={classNames('peripheral-status', { ok: peripheral.status.connected })}
						title={peripheral.status.connected ? 'Disconnected' : ''}
					>
						{peripheral.name}
						<div className="device-status__dot"></div>
					</div>
				)
			})}

			<IconButton title="Open Preferences" aria-label="open preferences" onClick={onSettingsClick}>
				<MdSettings />
			</IconButton>

			{/* Open Rundown dialog */}
			<Formik
				initialValues={{ rundownId: closedRundowns.length > 0 ? closedRundowns[0].rundownId : '' }}
				onSubmit={(values, actions) => {
					onOpen(values.rundownId)
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
										{closedRundowns &&
											closedRundowns.map((rundown) => (
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
									onClick={() => {
										setNewRundownOpen(true)
									}}
								>
									New Rundown
								</Button>
								<Button
									onClick={() => {
										formik.submitForm().catch(handleError)
									}}
								>
									Open
								</Button>
								<Button onClick={handleOpenRundownClose}>Close</Button>
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
					onCreate(values.name)
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
								<Button onClick={handleNewRundownClose}>Cancel</Button>
								<Button
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
						onRename(rundownToRename.rundownId, values.name)
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
								<Button onClick={handleRenameRundownClose}>Cancel</Button>
								<Button
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
}
