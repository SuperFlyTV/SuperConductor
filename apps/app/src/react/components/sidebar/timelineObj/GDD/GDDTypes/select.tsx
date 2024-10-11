import { assertNever } from '@shared/lib'
import { GDDTypeIntegerSelect, GDDTypeStringSelect, GDDTypeNumberSelect } from 'graphics-data-definition'
import React from 'react'
import { SelectEnum } from '../../../../inputs/SelectEnum.js'
import { getEditPropertyMeta, PropertyProps } from '../lib.js'
import { EditProperty } from '../util.js'

export const gddTypeSelect: React.FC<
	PropertyProps<GDDTypeIntegerSelect | GDDTypeStringSelect | GDDTypeNumberSelect>
> = (props) => {
	const data = props.data || ''
	const { label, description } = getEditPropertyMeta(props)

	const options: { [key: string]: any } = {}

	for (const enumValue of props.schema.enum) {
		const label = props.schema.gddOptions?.labels[enumValue] as string | undefined
		options[label || enumValue] = enumValue
	}

	return (
		<EditProperty className="gdd-edit-data__gddType__select" {...props}>
			<SelectEnum
				label={label}
				focusTooltip={description}
				fullWidth
				currentValue={data}
				onChange={(value) => {
					if (props.schema.type === 'string') {
						props.setData(String(value))
						props.onSave()
					} else if (props.schema.type === 'integer') {
						props.setData(parseInt(value, 10))
						props.onSave()
					} else if (props.schema.type === 'number') {
						props.setData(parseFloat(value))
						props.onSave()
					} else assertNever(props.schema)
				}}
				allowUndefined={true}
				options={options}
			/>
		</EditProperty>
	)
}
