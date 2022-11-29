import React from 'react'
import { Checkbox, CheckboxProps } from '@mui/material'

export function SmallCheckbox(props: CheckboxProps): JSX.Element {
	return <Checkbox sx={{ p: 0, pr: 1 }} size="small" {...props} />
}
