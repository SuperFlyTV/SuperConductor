import React, { useCallback, useEffect, useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from '@mui/material'
import { Mappings } from 'timeline-state-resolver-types'

interface INewMappingDialogProps {
	open: boolean
	deviceIds: string[]
	mappings: Mappings
	onAccepted: ({ deviceId, mappingId }: { deviceId: string; mappingId: string }) => void
	onDiscarded: () => void
}

export function NewMappingDialog({ open, deviceIds, mappings, onAccepted, onDiscarded }: INewMappingDialogProps) {
	const [deviceId, setDeviceId] = useState(deviceIds[0])
	const [mappingId, setMappingId] = useState('layer0')

	const accept = useCallback(() => {
		onAccepted({ deviceId, mappingId })
	}, [deviceId, mappingId, onAccepted])

	useEffect(() => {
		const numLayers = Object.keys(mappings).length
		setMappingId(`layer${numLayers}`)
	}, [mappings])

	return (
		<Dialog
			open={open}
			onClose={onDiscarded}
			onKeyUp={(e) => {
				if (e.key === 'Enter') accept()
			}}
		>
			<DialogTitle>Add New Mapping</DialogTitle>
			<DialogContent>
				<TextField
					select
					size="small"
					margin="normal"
					fullWidth
					label="Device ID"
					value={deviceId}
					onChange={(event) => {
						setDeviceId(event.target.value)
					}}
				>
					{deviceIds.map((id) => (
						<MenuItem key={id} value={id}>
							{id}
						</MenuItem>
					))}
				</TextField>
				<TextField
					size="small"
					margin="normal"
					fullWidth
					autoFocus
					label="Mapping ID"
					value={mappingId}
					onChange={(event) => {
						setMappingId(event.target.value)
					}}
				/>
			</DialogContent>
			<DialogActions>
				<Button variant="contained" onClick={onDiscarded}>
					Cancel
				</Button>
				<Button variant="contained" onClick={accept}>
					Create
				</Button>
			</DialogActions>
		</Dialog>
	)
}
