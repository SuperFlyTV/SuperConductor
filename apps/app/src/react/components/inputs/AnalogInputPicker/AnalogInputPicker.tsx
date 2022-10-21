import React, { useState } from 'react'
import { IconButton, InputAdornment, MenuItem, Popover, Typography } from '@mui/material'
import useId from '@mui/material/utils/useId'
import { HiLink } from 'react-icons/hi'
import { useMemoComputedObject } from '../../../mobx/lib'
import { store } from '../../../mobx/store'

export function AnalogInputOverridePicker() {
	const elementId = useId()
	const [anchorEl, setAnchorEl] = useState<Element | null>(null)

	const analogInputOptions = useMemoComputedObject(() => {
		const options: { [key: string]: string } = {}

		for (const [datastoreKey, setting] of Object.entries(store.projectStore.project.analogInputSettings)) {
			options[setting.label] = datastoreKey
		}

		return options
	}, [])

	const onClose = () => {
		setAnchorEl(null)
	}

	const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(e.currentTarget)
	}

	const onSelect = (e: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(null)
		// eslint-disable-next-line no-console
		console.log(e.currentTarget.dataset)
	}

	const open = Boolean(anchorEl)

	return (
		<>
			<InputAdornment position="end">
				<IconButton aria-label="set analog input override" edge="end" onClick={onClick}>
					<HiLink />
				</IconButton>
			</InputAdornment>
			<Popover
				id={elementId}
				open={open}
				anchorEl={anchorEl}
				onClose={onClose}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'right',
				}}
				transformOrigin={{
					vertical: 'top',
					horizontal: 'right',
				}}
			>
				<Typography sx={{ py: 1 }}>
					<MenuItem onClick={onSelect} data-value="">
						Remove Analog Input link
					</MenuItem>
					{Object.entries(analogInputOptions).map(([label, value]) => (
						<MenuItem key={value} data-value={value} onClick={onSelect}>
							{label}
						</MenuItem>
					))}
				</Typography>
			</Popover>
		</>
	)
}
