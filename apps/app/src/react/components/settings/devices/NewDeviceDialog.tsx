import React, { useCallback, useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from '@mui/material'
import { DeviceType } from 'timeline-state-resolver-types'

interface INewDeviceDialogProps {
	open: boolean
	onAccepted: ({ deviceType }: { deviceType: number }) => void
	onDiscarded: () => void
}

export function NewDeviceDialog({ open, onAccepted, onDiscarded }: INewDeviceDialogProps) {
	const [deviceType, setDeviceType] = useState(DeviceType.CASPARCG)

	const accept = useCallback(() => {
		onAccepted({ deviceType })
	}, [deviceType, onAccepted])

	return (
		<Dialog
			open={open}
			onClose={onDiscarded}
			onKeyUp={(e) => {
				if (e.key === 'Enter') accept()
			}}
		>
			<DialogTitle>Add New Device</DialogTitle>
			<DialogContent>
				<TextField
					select
					margin="normal"
					fullWidth
					autoFocus
					label="Device Type"
					value={deviceType.toString()}
					onChange={(event) => {
						setDeviceType(parseInt(event.target.value, 10))
					}}
				>
					<MenuItem value={DeviceType.CASPARCG}>CasparCG</MenuItem>
					<MenuItem value={DeviceType.ATEM}>ATEM</MenuItem>
					<MenuItem value={DeviceType.OBS}>OBS</MenuItem>
					<MenuItem value={DeviceType.VMIX}>vMix</MenuItem>
					<MenuItem value={DeviceType.OSC}>OSC</MenuItem>
					{/* @TODO: More device types */}
				</TextField>
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
