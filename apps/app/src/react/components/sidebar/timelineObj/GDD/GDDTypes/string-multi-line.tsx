import { GDDTypeMultiLine } from 'graphics-data-definition'
import React from 'react'
import { PropertyProps } from '../lib.js'
import { EditProperty } from '../util.js'

export const gddTypeMultiLine: React.FC<PropertyProps<GDDTypeMultiLine>> = (props) => {
	const data = props.data || ''
	return (
		<EditProperty className="gdd-edit-data__gddType__string-multi-line" {...props}>
			<textarea
				value={data}
				onChange={(e) => {
					props.setData(e.target.value)
				}}
				onBlur={props.onSave}
			/>
		</EditProperty>
	)
}
