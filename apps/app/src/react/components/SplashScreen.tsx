import React, { useEffect } from 'react'
import { Button, DialogTitle, IconButton, Dialog, DialogContent, DialogActions, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { styled } from '@mui/material/styles'
import { store } from '../mobx/store'

export const SplashScreen: React.FC = () => {
	const appStore = store.appStore

	const [open, setOpen] = React.useState(false)

	const handleClickOpen = () => {
		setOpen(true)
	}
	const handleRemindMeLater = () => {
		setOpen(false)
	}
	const handleClose = () => {
		setOpen(false)
		appStore.serverAPI.acknowledgeSeenVersion().catch(console.error)
	}

	useEffect(() => {
		if (appStore.version && appStore.version.seenVersion !== appStore.version.currentVersion) {
			setOpen(true)
		}
	}, [appStore.version])

	const seenVersion = appStore.version?.seenVersion
	const currentVersion = appStore.version?.currentVersion

	if (!currentVersion) return null

	return (
		<div>
			<Button variant="outlined" onClick={handleClickOpen}>
				Open dialog
			</Button>
			<BootstrapDialog onClose={handleClose} aria-labelledby="customized-dialog-title" open={open}>
				<BootstrapDialogTitle id="customized-dialog-title" onClose={handleClose}>
					{seenVersion ? <>SuperConductor has been updated!</> : <>SuperConductor</>}
				</BootstrapDialogTitle>
				<DialogContent dividers>
					{seenVersion ? (
						<Typography gutterBottom>
							SuperConductor has been updated from version <b>{seenVersion}</b> to <b>{currentVersion}</b>
							.{' '}
							<a
								href={`https://github.com/SuperFlyTV/SuperConductor/releases/tag/v${currentVersion}`}
								target="_blank"
								rel="noreferrer"
							>
								Release notes
							</a>
						</Typography>
					) : null}
					<Typography gutterBottom>
						This is an open beta, please try it out and{' '}
						<a href="https://github.com/SuperFlyTV/SuperConductor/issues" target="_blank" rel="noreferrer">
							be sure to report any issues you might have
						</a>
						. If you&apos;re missing a feature, we&apos;re happy to accept Pull Requests, or add new
						features as paid work.
					</Typography>
					<Typography gutterBottom>
						<h3>About us</h3>
						<a href="https://superfly.tv" target="_blank" rel="noreferrer">
							SuperFly.tv
						</a>{' '}
						is a consultancy company, we deliver custom solution for live broadcasts and events.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button autoFocus onClick={handleRemindMeLater}>
						Remind me later
					</Button>
					<Button autoFocus onClick={handleClose}>
						Close
					</Button>
				</DialogActions>
			</BootstrapDialog>
		</div>
	)
}

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
	'& .MuiDialogContent-root': {
		padding: theme.spacing(2),
	},
	'& .MuiDialogActions-root': {
		padding: theme.spacing(1),
	},
}))

interface DialogTitleProps {
	id: string
	children?: React.ReactNode
	onClose: () => void
}

const BootstrapDialogTitle = (props: DialogTitleProps) => {
	const { children, onClose, ...other } = props

	return (
		<DialogTitle sx={{ m: 0, p: 2 }} {...other}>
			{children}
			{onClose ? (
				<IconButton
					aria-label="close"
					onClick={onClose}
					sx={{
						position: 'absolute',
						right: 8,
						top: 8,
						color: (theme) => theme.palette.grey[500],
					}}
				>
					<CloseIcon />
				</IconButton>
			) : null}
		</DialogTitle>
	)
}
