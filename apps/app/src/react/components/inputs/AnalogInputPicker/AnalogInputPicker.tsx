import React, { useState } from 'react'
import { IconButton, InputAdornment, MenuItem, Popover, Tooltip, Typography } from '@mui/material'
import useId from '@mui/material/utils/useId'
import { HiLink, HiOutlineX } from 'react-icons/hi'
import { useMemoComputedObject, useMemoComputedValue } from '../../../mobx/lib'
import { store } from '../../../mobx/store'
import { TSRTimelineObj, TSRTimelineObjBase } from 'timeline-state-resolver-types'
import classNames from 'classnames'

import './style.scss'
import { firstValue, isIndeterminate } from '../../../lib/multipleEdit'
import { OnSave } from '../../sidebar/timelineObj/timelineObjs/lib'
import { observer } from 'mobx-react-lite'

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
export const AnalogInputOverridePicker: React.FC<{
	objs: TSRTimelineObj[]
	path: string
	onSave: OnSave
}> = observer(function AnalogInputOverridePicker({ objs, path, onSave }) {
	const elementId = useId()
	const [anchorEl, setAnchorEl] = useState<Element | null>(null)

	const analogInputOptions = useMemoComputedObject(() => {
		const options: { [datastoreKey: string]: { label: string; fullIdentifier: string | null } } = {}

		for (const [datastoreKey, setting] of Object.entries(store.projectStore.project.analogInputSettings)) {
			options[datastoreKey] = {
				label: setting.label,
				fullIdentifier: setting.fullIdentifier,
			}
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

		const newLink = e.currentTarget.dataset['value'] ?? ''
		if (newLink === '' && content?.$references) {
			// delete content.$references[path]

			onSave({
				content: {
					$references: {
						[path]: undefined,
					},
				},
			})
		} else if (newLink !== '') {
			onSave({
				content: {
					$references: {
						[path]: {
							datastoreKey: newLink,
							overwrite: false,
						},
					},
				},
			})
		}
	}
	const content = firstValue(objs, (obj) => (obj as TSRTimelineObjBase).content)
	const open = Boolean(anchorEl)

	const linkedDatastoreKey = content?.$references?.[path]?.datastoreKey
	const linkedAnalogInput = linkedDatastoreKey ? analogInputOptions[linkedDatastoreKey] : undefined

	const analogInputValue = useMemoComputedValue(() => {
		if (linkedAnalogInput?.fullIdentifier) {
			return store.analogStore.getAnalogInput(linkedAnalogInput.fullIdentifier)?.value
		} else return undefined
	}, [linkedAnalogInput])

	if (Object.keys(analogInputOptions).length === 0) {
		return null
	}
	if (isIndeterminate(objs, (obj) => (obj as TSRTimelineObjBase).content.$references)) {
		return null
	}
	if (!content) return null

	return (
		<>
			<InputAdornment position="end">
				<Tooltip title={linkedDatastoreKey ? `Linked to: ${linkedAnalogInput?.label}` : `Link to Analog Input`}>
					<>
						{analogInputValue !== undefined && (
							<span className="analog-input-picker__value">{analogInputValue}</span>
						)}
						<IconButton
							aria-label="set analog input override"
							edge="end"
							onClick={onClick}
							color={linkedDatastoreKey ? 'warning' : 'default'}
							className={classNames('analog-input-picker', linkedDatastoreKey && 'linked')}
						>
							<HiLink />
						</IconButton>
					</>
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
					{linkedDatastoreKey && (
						<MenuItem onClick={onSelect} data-value="">
							<HiOutlineX />
							Remove Analog Input link
						</MenuItem>
					)}
					{Object.entries(analogInputOptions).map(([datastoreKey, option]) => (
						<MenuItem key={datastoreKey} data-value={datastoreKey} onClick={onSelect}>
							{option.label}
						</MenuItem>
					))}
				</Typography>
			</Popover>
		</>
	)
})
