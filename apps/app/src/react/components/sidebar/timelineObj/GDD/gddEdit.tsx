import React, { useState, useEffect } from 'react'
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
	validateData,
} from 'graphics-data-definition'
import { getBasicType } from './lib'

import './style.scss'
import { clone } from 'lodash'

export const EditGDDData: React.FC<{
	schema: GDDSchema
	data: any
	onSaveData: (newData: any) => void
}> = ({ schema, data, onSaveData }) => {
	// const setData = (data) => {
	// 	props.setData(data)
	// }

	const [currentData, setCurrentData] = useState(data)
	useEffect(() => {
		setCurrentData(data)
	}, [data])

	const updateCurrentData = (data: any) => {
		setCurrentData(clone(data))
	}
	const onBlur = () => {
		onSaveData(currentData)
	}

	return (
		<div className="gdd-edit-data">
			{componentAny({
				schema: schema,
				data: currentData,
				setData: updateCurrentData,
				onSave: onBlur,
				property: '',
			})}
		</div>
	)
}
interface ComponentAnyProps<T> {
	schema: T
	data: any
	setData: (newData: any) => void
	onSave: () => void

	property: string | number

	inTableRow?: boolean
	inTableCell?: boolean
}
interface PropertyProps<T> extends ComponentAnyProps<T> {
	key: string
	dataValidation: string | null
}

const componentAny: React.FC<ComponentAnyProps<GDDSchemaProperty>> = (props) => {
	// if (!props.schema) return null

	const basicType = getBasicType(props.schema.type)

	const innerProps: PropertyProps<any> = {
		...props,
		key: String(props.property),
		dataValidation: validateData(props.schema as GDDSchema, props.data),
	}

	if (basicType === 'boolean') return propertyBoolean(innerProps)
	if (basicType === 'string') return propertyString(innerProps)
	if (basicType === 'number') return propertyNumber(innerProps)
	if (basicType === 'integer') return propertyInteger(innerProps)
	if (basicType === 'array') return propertyArray(innerProps)
	if (basicType === 'object') return propertyObject(innerProps)

	return propertyUnknown({ ...innerProps, basicType })
}

const EditProperty: React.FC<
	PropertyProps<any> & {
		inTableRow?: boolean
		className?: string
		children: React.ReactNode
	}
> = (props) => {
	const schema = props.schema as GDDSchema
	const label = schema.title || props.property
	const description = props.schema.description

	if (props.inTableRow || props.inTableCell) {
		return (
			<td>
				<div className={'gdd-edit-data__gdd-property gdd-edit-data__gdd-property-' + props.className}>
					<div className="gdd-edit-data__edit">{props.children}</div>
				</div>
			</td>
		)
	} else {
		return (
			<div className={'gdd-edit-data__gdd-property gdd-edit-data__gdd-property-' + props.className}>
				<div className="gdd-edit-data__gdd-edit-data__label">{label}</div>
				{description && <div className="gdd-edit-data__description">{description}</div>}
				<div className="gdd-edit-data__gdd-edit-data__edit">{props.children}</div>
				{props.dataValidation && <div className="gdd-edit-data__data-validation">{props.dataValidation}</div>}
			</div>
		)
	}
}

const propertyUnknown: React.FC<PropertyProps<GDDSchema> & { basicType: string }> = (props) => {
	return (
		<EditProperty className="gdd-edit-data__unknown" {...props}>
			Unknown type &quot;{props.basicType}&quot;
		</EditProperty>
	)
}
const propertyBoolean: React.FC<PropertyProps<GDDSchemaPropertyBoolean>> = (props) => {
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
const propertyString: React.FC<PropertyProps<GDDSchemaPropertyString>> = (props) => {
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
const propertyNumber: React.FC<PropertyProps<GDDSchemaPropertyNumber>> = (props) => {
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
const propertyInteger: React.FC<PropertyProps<GDDSchemaPropertyInteger>> = (props) => {
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
const propertyArray: React.FC<PropertyProps<GDDSchemaPropertyArray>> = (props) => {
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

const propertyObject: React.FC<PropertyProps<GDDSchemaPropertyObject>> = (props) => {
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
