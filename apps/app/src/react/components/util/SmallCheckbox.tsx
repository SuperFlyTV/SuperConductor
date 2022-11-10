import React from 'react'
import { Checkbox, CheckboxProps } from '@mui/material'

export function SmallCheckbox(props: CheckboxProps) {
	return <Checkbox sx={{ p: 0, pr: 1 }} size="small" {...props} />
}
