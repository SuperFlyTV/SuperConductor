import React from 'react'
import { Button, DialogTitle, IconButton, Dialog, DialogContent, DialogActions, Typography } from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import { styled } from '@mui/material/styles'

export const SplashScreen: React.FC<{
	seenVersion: string | null | undefined
	currentVersion: string | undefined
	onClose: (remindMeLater: boolean) => void
}> = ({ seenVersion, currentVersion, onClose }) => {
	if (!currentVersion) return null

	return (
		<BootstrapDialog onClose={() => onClose(false)} aria-labelledby="customized-dialog-title" open={true}>
			<BootstrapDialogTitle id="customized-dialog-title" onClose={() => onClose(false)}>
				{seenVersion && seenVersion !== currentVersion ? (
					<>SuperConductor has been updated!</>
				) : (
					<>SuperConductor</>
				)}
			</BootstrapDialogTitle>
			<DialogContent dividers>
				{seenVersion && seenVersion !== currentVersion ? (
					<Typography gutterBottom>
						SuperConductor has been updated from version <b>{seenVersion}</b> to <b>{currentVersion}</b> (
						<a
							href={`https://github.com/SuperFlyTV/SuperConductor/releases/tag/v${currentVersion}`}
							target="_blank"
							rel="noreferrer"
						>
							Release notes
						</a>
						).
					</Typography>
				) : (
					<Typography gutterBottom>
						SuperConductor, version {currentVersion}, (
						<a
							href={`https://github.com/SuperFlyTV/SuperConductor/releases/tag/v${currentVersion}`}
							target="_blank"
							rel="noreferrer"
						>
							Release notes
						</a>
						).
					</Typography>
				)}
				<Typography gutterBottom>
					This is a pet project from{' '}
					<em>
						<a href="https://superfly.tv/" target="_blank" rel="noreferrer">
							SuperFly.tv
						</a>
					</em>
					.<br />
					It is still in early development, there might be bugs and some features are probably missing, but we
					hope you&apos;ll find it useful and we invite you to join us in improving it!
					<br />
					<br />
					Be sure to{' '}
					<a href="https://github.com/SuperFlyTV/SuperConductor/issues" target="_blank" rel="noreferrer">
						report any issues you might have
					</a>
					. If you&apos;re missing a feature, we&apos;re happy to accept contributions as pull requests!
				</Typography>
				<Typography gutterBottom>
					<br />
					<br />
					This program is free software: you can redistribute it and/or modify it under the terms of the GNU
					Affero General Public License as published by the Free Software Foundation, either version 3 of the
					License, or (at your option) any later version. This program is distributed in the hope that it will
					be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
					FOR A PARTICULAR PURPOSE. See the{' '}
					<a
						href="https://github.com/SuperFlyTV/SuperConductor/blob/master/COPYING"
						target="_blank"
						rel="noreferrer"
					>
						GNU Affero General Public License
					</a>{' '}
					for more details.
				</Typography>
			</DialogContent>
			<DialogActions>
				<Button autoFocus onClick={() => onClose(true)}>
					Remind me later
				</Button>
				<Button autoFocus onClick={() => onClose(false)}>
					Close
				</Button>
			</DialogActions>
		</BootstrapDialog>
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
