import { GDDTypeSingleLine } from 'graphics-data-definition'
import React from 'react'
import { EditProperty, PropertyProps } from '../lib'

export const gddTypeSingleLine: React.FC<PropertyProps<GDDTypeSingleLine>> = (props) => {
	const data = props.data || ''
	return (
		<EditProperty className="gdd-edit-data__gddType__string-single-line" {...props}>
			<input
				type="text"
				value={data}
				onChange={(e) => {
					props.setData(e.target.value)
				}}
				onBlur={props.onSave}
			/>
		</EditProperty>
	)
}
