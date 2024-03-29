import { GDDTypeSingleLine } from 'graphics-data-definition'
import React from 'react'
import { TextInput } from '../../../../inputs/TextInput'
import { EditProperty, getEditPropertyMeta, PropertyProps } from '../lib'

export const gddTypeSingleLine: React.FC<PropertyProps<GDDTypeSingleLine>> = (props) => {
	const data = props.data || ''
	const { label, description } = getEditPropertyMeta(props)
	return (
		<EditProperty className="gdd-edit-data__gddType__string-single-line" {...props}>
			<TextInput
				label={label}
				focusTooltip={description}
				fullWidth
				currentValue={data}
				onChange={(v) => {
					props.setData(v || undefined)
					props.onSave()
				}}
				allowUndefined={true}
			/>
		</EditProperty>
	)
}
