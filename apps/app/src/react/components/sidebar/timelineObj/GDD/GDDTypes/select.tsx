import { assertNever } from '@shared/lib'
import { GDDTypeIntegerSelect, GDDTypeStringSelect, GDDTypeNumberSelect } from 'graphics-data-definition'
import React from 'react'
import { EditProperty, PropertyProps } from '../lib'

export const gddTypeSelect: React.FC<
	PropertyProps<GDDTypeIntegerSelect | GDDTypeStringSelect | GDDTypeNumberSelect>
> = (props) => {
	const data = props.data || ''
	return (
		<EditProperty className="gdd-edit-data__gddType__select" {...props}>
			<select
				value={data}
				onChange={(e) => {
					const value = e.target.value

					if (props.schema.type === 'string') props.setData(String(value))
					else if (props.schema.type === 'integer') props.setData(parseInt(value, 10))
					else if (props.schema.type === 'number') props.setData(parseFloat(value))
					else assertNever(props.schema)
				}}
				onBlur={props.onSave}
			>
				{props.schema.enum.map((enumValue, index) => {
					const label = props.schema.gddOptions?.labels[enumValue] as string | undefined
					return (
						<option key={index} value={enumValue}>
							{label || enumValue}
						</option>
					)
				})}
			</select>
		</EditProperty>
	)
}
