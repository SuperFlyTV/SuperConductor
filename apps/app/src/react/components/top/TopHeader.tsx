import { BridgeStatus } from '../../../models/project/Bridge'
import classNames from 'classnames'
import React, { useState } from 'react'
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	FormControlLabel,
	FormLabel,
	IconButton,
	Radio,
	RadioGroup,
} from '@mui/material'
import { MdAdd, MdClose } from 'react-icons/md'
import { Field, Form, Formik } from 'formik'
import { TextField } from 'formik-mui'
import * as Yup from 'yup'

const newRundownValidationSchema = Yup.object({
	name: Yup.string().label('Rundown Name').required(),
})

export const TopHeader: React.FC<{
	selectedRundownId?: string
	openRundowns: { rundownId: string; name: string }[]
	closedRundowns: { rundownId: string; name: string }[]
	bridgeStatuses: { [bridgeId: string]: BridgeStatus }
	onSelect: (rundownId: string) => void
	onClose: (rundownId: string) => void
	onOpen: (rundownFileName: string) => void
	onCreate: (rundownName: string) => void
}> = ({ selectedRundownId, openRundowns, closedRundowns, bridgeStatuses, onSelect, onClose, onOpen, onCreate }) => {
	const [openRundownOpen, setOpenRundownOpen] = useState(false)
	const [newRundownOpen, setNewRundownOpen] = useState(false)
	const [rundownToOpen, setRundownToOpen] = useState('')

	const handleOpenRundownClose = () => {
		setOpenRundownOpen(false)
	}

	const handleNewRundownClose = () => {
		setNewRundownOpen(false)
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
					>
						{rundown.name}

						<IconButton
							color="error"
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
				aria-label="create new rundown"
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

			<Dialog open={openRundownOpen} onClose={handleOpenRundownClose}>
				<DialogTitle>Open Rundown</DialogTitle>
				<DialogContent>
					<FormControl>
						<FormLabel id="rundowns-radio-buttons-group-label">Rundowns</FormLabel>
						<RadioGroup
							aria-labelledby="rundowns-radio-buttons-group-label"
							name="rundowns-radio-buttons-group"
							value={rundownToOpen}
							onChange={(event) => {
								setRundownToOpen(event.target.value)
							}}
						>
							{closedRundowns &&
								closedRundowns.map((rundown) => (
									<FormControlLabel
										key={rundown.rundownId}
										value={rundown.rundownId}
										control={<Radio />}
										label={rundown.name}
									/>
								))}
						</RadioGroup>
					</FormControl>
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
							onOpen(rundownToOpen)
							setOpenRundownOpen(false)
						}}
					>
						Open
					</Button>
					<Button onClick={handleOpenRundownClose}>Close</Button>
				</DialogActions>
			</Dialog>

			<Formik
				initialValues={{ name: 'New Rundown' }}
				validationSchema={newRundownValidationSchema}
				enableReinitialize={true}
				onSubmit={(values, actions) => {
					onCreate(values.name)
					setNewRundownOpen(false)
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
								<Button
									onClick={() => {
										formik.submitForm().catch(console.error)
									}}
								>
									Create
								</Button>
								<Button onClick={handleNewRundownClose}>Cancel</Button>
							</DialogActions>
						</Dialog>
					)
				}}
			</Formik>
		</>
	)
}
