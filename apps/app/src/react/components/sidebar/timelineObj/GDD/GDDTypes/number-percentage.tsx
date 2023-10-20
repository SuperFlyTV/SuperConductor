import { GDDTypeDurationMs } from 'graphics-data-definition'
import React from 'react'
import { getEditPropertyMeta, PropertyProps } from '../lib'
import { EditProperty } from '../util'
import { PercentageInput } from '../../../../inputs/PercentageInput'

export const gddTypePercentage: React.FC<PropertyProps<GDDTypeDurationMs>> = (props) => {
	const data = props.data || ''
	const { label, description } = getEditPropertyMeta(props)
	return (
		<EditProperty className="gdd-edit-data__gddType__integer-duration-ms" {...props}>
			<PercentageInput
				label={label}
				focusTooltip={description}
				fullWidth
				currentValue={data}
				onChange={(v) => {
					props.setData(v)
					props.onSave()
				}}
				allowUndefined={true}
			/>
		</EditProperty>
	)
}