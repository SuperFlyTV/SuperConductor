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
import { componentAny } from './componentAny'
import { EditProperty, PropertyProps } from './lib'

export const basicPropertyUnknown: React.FC<PropertyProps<GDDSchema> & { basicType: string }> = (props) => {
	return (
		<EditProperty className="gdd-edit-data__unknown" {...props}>
			Unknown type &quot;{props.basicType}&quot;
		</EditProperty>
	)
}
export const basicPropertyBoolean: React.FC<PropertyProps<GDDSchemaPropertyBoolean>> = (props) => {
	const data = !!props.data
	return (
		<EditProperty className="gdd-edit-data__boolean" {...props}>
			<input
				type="checkbox"
				checked={data}
				onChange={(e) => {
					props.setData(e.target.checked)
				}}
				onBlur={props.onSave}
			/>
		</EditProperty>
	)
}
export const basicPropertyString: React.FC<PropertyProps<GDDSchemaPropertyString>> = (props) => {
	const data = props.data || ''
	return (
		<EditProperty className="gdd-edit-data__string" {...props}>
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
export const basicPropertyNumber: React.FC<PropertyProps<GDDSchemaPropertyNumber>> = (props) => {
	const data = props.data || ''
	return (
		<EditProperty className="gdd-edit-data__number" {...props}>
			<input
				type="number"
				value={data}
				onChange={(e) => {
					props.setData(parseFloat(e.target.value))
				}}
				onBlur={props.onSave}
			/>
		</EditProperty>
	)
}
export const basicPropertyInteger: React.FC<PropertyProps<GDDSchemaPropertyInteger>> = (props) => {
	const data = props.data || ''
	return (
		<EditProperty className="gdd-edit-data__integer" {...props}>
			<input
				type="number"
				value={data}
				onChange={(e) => {
					props.setData(parseInt(e.target.value))
				}}
				onBlur={props.onSave}
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
		columns = Object.entries(schema.items.properties)
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
									property: index,
									schema: schema.items,
									data: itemData,
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
				{Object.entries(properties).map(([subProperty, subSchema]) => {
					const propData = data[subProperty]
					const propSetData = (d: any) => {
						data[subProperty] = d
						props.setData(data)
					}

					return componentAny({
						property: subProperty,
						schema: subSchema,
						data: propData,
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
					{Object.entries(properties).map(([subProperty, subSchema]) => {
						const propData = data[subProperty]
						const propSetData = (d: any) => {
							data[subProperty] = d
							props.setData(data)
						}
						return (
							<div className="gdd-edit-data__property" key={subProperty}>
								{componentAny({
									property: subProperty,
									schema: subSchema,
									data: propData,
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

	return null
}
