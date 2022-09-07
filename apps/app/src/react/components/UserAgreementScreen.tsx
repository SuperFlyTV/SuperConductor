import React from 'react'
import { Button, Dialog, DialogContent, DialogActions, Typography } from '@mui/material'
import { styled } from '@mui/material/styles'
import { USER_AGREEMENT_VERSION } from '../../lib/userAgreement'

/**
 * The User Agreement is shown to users on startup
 * Note: If any changes are made to the user agreement, USER_AGREEMENT_VERSION must be incremeneted so that it's shown to users again
 */

export const UserAgreementScreen: React.FC<{
	onAgree: (agreementVersion: string) => void
	onDisagree: () => void
}> = ({ onAgree, onDisagree }) => {
	return (
		<BootstrapDialog aria-labelledby="customized-dialog-title" open={true}>
			<DialogContent dividers>
				<Typography gutterBottom>
					<b>SuperConductor User Agreement</b>
					<br />
					<br />
					<b>By using this software you agree to this User Agreement:</b>
					<br />
					<br />
					<b>This is a pre-release software</b>, features will be added and <i>might be removed</i> in later
					versions. It is <b>free to use</b>, although we (SuperFly.tv) reserve the right to possibly
					introduce a paid version in the future, to ensure further development and maintenance.
					<br />
					<br />
					<b>Crash/Error reporting and statistics</b>
					<br />
					SuperConductor sends crash/error reports and the Operating System version upon startup, to
					SuperFly.tv. This helps us understand how the application is used and helps us with planning for
					future features.
					<br />
					The sent data is anonymous, and you can see exactly what data is sent in{' '}
					<a
						href="https://github.com/SuperFlyTV/SuperConductor/blob/master/apps/app/src/electron/telemetry.ts"
						target="_blank"
						rel="noreferrer"
					>
						the source code here
					</a>
					.<br />
					<br />
				</Typography>

				<Typography gutterBottom>
					<b>LICENSE</b>
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
				<Button autoFocus onClick={() => onDisagree()}>
					No, close the application
				</Button>
				<Button autoFocus onClick={() => onAgree(USER_AGREEMENT_VERSION)}>
					I accept the User Agreement
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
