import React, { useMemo, useState } from 'react'
import { IconButton, InputAdornment, MenuItem, Popover, Tooltip, Typography } from '@mui/material'
import useId from '@mui/material/utils/useId'
import { HiLink, HiOutlineAdjustments, HiOutlineX } from 'react-icons/hi'
import { useMemoComputedObject } from '../../../mobx/lib'
import { store } from '../../../mobx/store'
import './style.css'
import { TSRTimelineObj, TSRTimelineObjBase } from 'timeline-state-resolver-types'

const POPOVER_ANCHOR_ORIGIN: {
	vertical: 'bottom'
	horizontal: 'right'
} = {
	vertical: 'bottom',
	horizontal: 'right',
}
const POPOVER_TRANSFORM_ORIGIN: {
	vertical: 'top'
	horizontal: 'right'
} = {
	vertical: 'top',
	horizontal: 'right',
}

export function AnalogInputOverridePicker({
	obj,
	path,
	onSave,
}: {
	obj: TSRTimelineObj
	path: string
	onSave: (newObj: TSRTimelineObj) => void
}) {
	const elementId = useId()
	const [anchorEl, setAnchorEl] = useState<Element | null>(null)

	const analogInputOptions = useMemoComputedObject(() => {
		const options: { [key: string]: string } = {}

		for (const [datastoreKey, setting] of Object.entries(store.projectStore.project.analogInputSettings)) {
			options[setting.label] = datastoreKey
		}

		return options
	}, [])

	const content = (obj as TSRTimelineObjBase).content

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

		const newLink = e.currentTarget.dataset['value'] ?? ''
		if (newLink === '' && content.$references) {
			delete content.$references[path]
			onSave(obj)
		} else if (newLink !== '') {
			if (!content.$references) {
				content.$references = {}
			}

			content.$references[path] = {
				datastoreKey: newLink,
				overwrite: false,
			}

			onSave(obj)
		}
	}

	const open = Boolean(anchorEl)
	const currentLink = content.$references?.[path]?.datastoreKey
	const currentAnalogInputLabelIdPair = useMemo(
		() => Object.entries(analogInputOptions).find(([_, value]) => value === currentLink),
		[analogInputOptions, currentLink]
	)
	const currentAnalogInputLabel = currentAnalogInputLabelIdPair?.[0] ?? ''

	return (
		<>
			<InputAdornment position="end">
				<Tooltip title={currentLink ? `Linked to: ${currentAnalogInputLabel}` : `Set Analog Input link`}>
					<IconButton
						aria-label="set analog input override"
						edge="end"
						onClick={onClick}
						color={currentLink ? 'warning' : 'default'}
					>
						{currentLink ? <HiOutlineAdjustments /> : <HiLink />}
					</IconButton>
				</Tooltip>
			</InputAdornment>
			<Popover
				id={elementId}
				open={open}
				anchorEl={anchorEl}
				onClose={onClose}
				anchorOrigin={POPOVER_ANCHOR_ORIGIN}
				transformOrigin={POPOVER_TRANSFORM_ORIGIN}
				className="analog-input-picker-popover"
			>
				<Typography sx={{ py: 1 }}>
					{currentLink && (
						<MenuItem onClick={onSelect} data-value="">
							<HiOutlineX />
							Remove Analog Input link
						</MenuItem>
					)}
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
