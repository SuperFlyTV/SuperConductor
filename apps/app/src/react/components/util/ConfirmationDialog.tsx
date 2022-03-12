import React from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'

interface IProps {
	open: boolean
	onAccepted: () => void
	onDiscarded: () => void
	acceptLabel: string
	title: string
	body: string
}

export function ConfirmationDialog({ open, title, body, acceptLabel, onAccepted, onDiscarded }: IProps) {
	return (
		<Dialog
			open={open}
			onClose={onDiscarded}
			onKeyUp={(e) => {
				if (e.key === 'Enter') onAccepted()
			}}
		>
			<DialogTitle>{title}</DialogTitle>
			<DialogContent>{body}</DialogContent>
			<DialogActions>
				<Button variant="contained" onClick={onDiscarded}>
					Cancel
				</Button>
				<Button variant="contained" onClick={onAccepted}>
					{acceptLabel}
				</Button>
			</DialogActions>
		</Dialog>
	)
}
