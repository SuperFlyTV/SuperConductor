import { GDDSchema } from 'graphics-data-definition'
import React from 'react'

export function getBasicType(schemaType: string | string[]): string {
	return Array.isArray(schemaType) ? schemaType[0] : schemaType
}
export interface ComponentAnyProps<T> {
	schema: T
	data: any
	setData: (newData: any) => void
	onSave: () => void

	property: string | number

	inTableRow?: boolean
	inTableCell?: boolean
}
export interface PropertyProps<T> extends ComponentAnyProps<T> {
	key: string
	dataValidation: string | null
}
export const EditProperty: React.FC<
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
