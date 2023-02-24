import { GDDTypeColorRRGGBB } from 'graphics-data-definition'
import React from 'react'
import { EditProperty, PropertyProps } from '../lib'

export const gddTypeColorRRGGBB: React.FC<PropertyProps<GDDTypeColorRRGGBB>> = (props) => {
	const data = props.data || ''
	return (
		<EditProperty className="gdd-edit-data__gddType__string-color-rrggbb" {...props}>
			<input
				type="color"
				value={data}
				onChange={(e) => {
					props.setData(e.target.value)
				}}
				onBlur={props.onSave}
			/>
		</EditProperty>
	)
}
