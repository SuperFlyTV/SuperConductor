import React from 'react'
import { CircularProgress } from '@mui/material'

export function Spinner({ heavyOperation }: { heavyOperation?: boolean }): JSX.Element {
	return (
		<>
			<CircularProgress disableShrink={heavyOperation} />
		</>
	)
}
