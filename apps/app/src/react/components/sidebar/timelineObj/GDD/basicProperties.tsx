import {
	GDDSchema,
	GDDSchemaProperty,
	GDDSchemaPropertyArray,
	GDDSchemaPropertyBoolean,
	GDDSchemaPropertyInteger,
	GDDSchemaPropertyNumber,
	GDDSchemaPropertyObject,
	GDDSchemaPropertyString,
	getDefaultDataFromSchema,
} from 'graphics-data-definition'
import React from 'react'
import { AnalogInputOverridePicker } from '../../../inputs/AnalogInputPicker/AnalogInputPicker.js'
import { BooleanInput } from '../../../inputs/BooleanInput.js'
import { FloatInput } from '../../../inputs/FloatInput.js'
import { IntInput } from '../../../inputs/IntInput.js'
import { TextInput } from '../../../inputs/TextInput.js'
import { componentAny } from './componentAny.js'
import { getEditPropertyMeta, PropertyProps } from './lib.js'
import { EditProperty } from './util.js'

export const basicPropertyUnknown: React.FC<PropertyProps<GDDSchema> & { basicType: string }> = (props) => {
	return (
		<EditProperty className="gdd-edit-data__unknown" {...props}>
			Unknown type &quot;{props.basicType}&quot;
		</EditProperty>
	)
}
export const basicPropertyBoolean: React.FC<PropertyProps<GDDSchemaPropertyBoolean>> = (props) => {
	const data = !!props.data
	const { label, description } = getEditPropertyMeta(props)
	return (
		<EditProperty className="gdd-edit-data__boolean" {...props}>
			<BooleanInput
				label={label}
				tooltip={description}
				currentValue={data}
				onChange={(v) => {
					props.setData(v)
					props.onSave()
				}}
			/>
		</EditProperty>
	)
}
export const basicPropertyString: React.FC<PropertyProps<GDDSchemaPropertyString>> = (props) => {
	const data = props.data || ''
	const { label, description } = getEditPropertyMeta(props)
	return (
		<EditProperty className="gdd-edit-data__string" {...props}>
			<TextInput
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
export const basicPropertyNumber: React.FC<PropertyProps<GDDSchemaPropertyNumber>> = (props) => {
	const data = props.data ?? ''
	const { label, description } = getEditPropertyMeta(props)
	return (
		<EditProperty className="gdd-edit-data__number" {...props}>
			<FloatInput
				label={label}
				focusTooltip={description}
				fullWidth
				currentValue={data}
				onChange={(v) => {
					props.setData(v)
					props.onSave()
				}}
				allowUndefined={true}
				endAdornment={
					<AnalogInputOverridePicker
						objs={props.objs}
						path={'data.' + props.fullPath.join('.')}
						onSave={props.onSaveObj}
					/>
				}
			/>
		</EditProperty>
	)
}
export const basicPropertyInteger: React.FC<PropertyProps<GDDSchemaPropertyInteger>> = (props) => {
	const data = props.data ?? ''
	const { label, description } = getEditPropertyMeta(props)

	return (
		<EditProperty className="gdd-edit-data__integer" {...props}>
			<IntInput
				label={label}
				focusTooltip={description}
				fullWidth
				currentValue={data}
				onChange={(v) => {
					props.setData(v)
					props.onSave()
				}}
				allowUndefined={true}
				endAdornment={
					<AnalogInputOverridePicker
						objs={props.objs}
						path={'data.' + props.fullPath.join('.')}
						onSave={props.onSaveObj}
					/>
				}
			/>
		</EditProperty>
	)
}
export const basicPropertyArray: React.FC<PropertyProps<GDDSchemaPropertyArray>> = (props) => {
	let data = props.data
	if (!Array.isArray(data)) data = []

	const schema = props.schema

	let columns: [string, GDDSchemaProperty][] = []
	if (schema.items.type === 'object') {
		columns = Object.entries<GDDSchemaProperty>(schema.items.properties)
	} else {
		columns = [['', schema.items]]
	}

	return (
		<EditProperty className="gdd-edit-data__array" {...props}>
			<table>
				<thead>
					<tr>
						{columns.map(([columnKey, column]) => {
							return (
								<th className="gdd-edit-data__header" key={String(columnKey)}>
									<div className="gdd-edit-data__label">{column.title || columnKey}</div>
									{column.description && (
										<div className="gdd-edit-data__description">{column.description}</div>
									)}
								</th>
							)
						})}
					</tr>
				</thead>
				<tbody>
					{data.map((itemData: any, index: number) => {
						const itemSetData = (d: any) => {
							data[index] = d
							props.setData(data)
						}

						return (
							<tr className="gdd-edit-data__item" key={index}>
								{componentAny({
									objs: props.objs,
									fullPath: [...props.fullPath, String(index)],
									property: index,
									schema: schema.items,
									data: itemData,
									onSaveObj: props.onSaveObj,
									setData: itemSetData,
									onSave: props.onSave,
									inTableRow: true,
								})}
								<td>
									<button
										className="gdd-edit-data__delete"
										onClick={() => {
											data.splice(index, 1)
											props.setData(data)
											props.onSave()
										}}
									>
										🗑
									</button>
								</td>
							</tr>
						)
					})}
					<tr>
						<td colSpan={99}>
							<button
								className="gdd-edit-data__add"
								onClick={() => {
									data.push(getDefaultDataFromSchema(schema.items) ?? null)
									props.setData(data)
									props.onSave()
								}}
							>
								+
							</button>
						</td>
					</tr>
				</tbody>
			</table>
		</EditProperty>
	)
}

export const basicPropertyObject: React.FC<PropertyProps<GDDSchemaPropertyObject>> = (props) => {
	let data = props.data || {}
	if (typeof data !== 'object' || Array.isArray(data)) data = {}

	const properties = props.schema.properties || {}

	if (props.inTableRow) {
		return (
			<>
				{Object.entries<GDDSchemaProperty>(properties).map(([subProperty, subSchema]) => {
					const propData = data[subProperty]
					const propSetData = (d: any) => {
						data[subProperty] = d
						props.setData(data)
					}

					return componentAny({
						objs: props.objs,
						fullPath: [...props.fullPath, subProperty],
						property: subProperty,
						schema: subSchema,
						data: propData,
						onSaveObj: props.onSaveObj,
						setData: propSetData,
						onSave: props.onSave,
						inTableCell: true,
					})
				})}
			</>
		)
	} else {
		return (
			<EditProperty className="gdd-edit-data__object" {...props}>
				<div className="gdd-edit-data__properties">
					{Object.entries<GDDSchemaProperty>(properties).map(([subProperty, subSchema]) => {
						const propData = data[subProperty]
						const propSetData = (d: any) => {
							data[subProperty] = d
							props.setData(data)
						}
						return (
							<div className="gdd-edit-data__property" key={subProperty}>
								{componentAny({
									objs: props.objs,
									fullPath: [...props.fullPath, subProperty],
									property: subProperty,
									schema: subSchema,
									data: propData,
									onSaveObj: props.onSaveObj,
									setData: propSetData,
									onSave: props.onSave,
								})}
							</div>
						)
					})}
				</div>
			</EditProperty>
		)
	}
}
