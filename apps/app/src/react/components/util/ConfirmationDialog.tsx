import React from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'

interface IProps {
	open: boolean
	onAccepted: () => void
	onDiscarded: () => void
	acceptLabel: string
	title: string
	children: JSX.Element
}

export function ConfirmationDialog({
	open,
	title,
	children,
	acceptLabel,
	onAccepted,
	onDiscarded,
}: IProps): JSX.Element {
	return (
		<Dialog
			open={open}
			onClose={onDiscarded}
			onKeyUp={(e) => {
				if (e.key === 'Enter') onAccepted()
			}}
		>
			<DialogTitle>{title}</DialogTitle>
			<DialogContent>{children}</DialogContent>
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
