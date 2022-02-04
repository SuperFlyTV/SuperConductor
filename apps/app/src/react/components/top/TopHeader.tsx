import { BridgeStatus } from '../../../models/project/Bridge'
import classNames from 'classnames'
import React, { useEffect, useState } from 'react'
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
	TextField,
} from '@mui/material'
import { MdAdd, MdClose } from 'react-icons/md'

export const TopHeader: React.FC<{
	selectedRundownId?: string
	openRundowns: { rundownId: string; name: string }[]
	closedRundowns?: { fileName: string; version: number; name: string; open: boolean }[]
	bridgeStatuses: { [bridgeId: string]: BridgeStatus }
	onSelect: (rundownId: string) => void
	onClose: (rundownId: string) => void
	onOpenDialogOpened: () => void
	onOpen: (rundownFileName: string) => void
	onCreate: (rundownName: string) => void
}> = ({
	selectedRundownId,
	openRundowns,
	closedRundowns,
	bridgeStatuses,
	onSelect,
	onClose,
	onOpenDialogOpened,
	onOpen,
	onCreate,
}) => {
	const [openRundownOpen, setOpenRundownOpen] = useState(false)
	const [newRundownOpen, setNewRundownOpen] = useState(false)
	const [newRundownName, setNewRundownName] = useState('')
	const [rundownToOpen, setRundownToOpen] = useState('')

	useEffect(() => {
		if (openRundownOpen) {
			onOpenDialogOpened()
		}
	}, [openRundownOpen, onOpenDialogOpened])

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
										key={rundown.fileName}
										value={rundown.fileName}
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

			<Dialog open={newRundownOpen} onClose={handleNewRundownClose}>
				<DialogTitle>Create New Rundown</DialogTitle>
				<DialogContent>
					<TextField
						label="New Rundown Name"
						margin="normal"
						value={newRundownName}
						onChange={(event) => {
							setNewRundownName(event.target.value)
						}}
					/>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => {
							onCreate(newRundownName)
							setNewRundownOpen(false)
						}}
					>
						Create
					</Button>
					<Button onClick={handleNewRundownClose}>Cancel</Button>
				</DialogActions>
			</Dialog>
		</>
	)
}
