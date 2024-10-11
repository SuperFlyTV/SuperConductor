import React from 'react'
import { PropertyProps, getEditPropertyMeta } from './lib.js'

export const WithLabel: React.FC<
	PropertyProps<any> & {
		inTableRow?: boolean
		className?: string
		children: React.ReactNode
	}
> = (props) => {
	const { label, description } = getEditPropertyMeta(props)

	return (
		<>
			<div className="gdd-edit-data__gdd-edit-data__label">{label}</div>
			{description && <div className="gdd-edit-data__description">{description}</div>}
			{props.children}
		</>
	)
}
export const EditProperty: React.FC<
	PropertyProps<any> & {
		inTableRow?: boolean
		className?: string
		children: React.ReactNode
	}
> = (props) => {
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
				{/* <div className="gdd-edit-data__gdd-edit-data__label">{label}</div>
				{description && <div className="gdd-edit-data__description">{description}</div>} */}
				<div className="gdd-edit-data__gdd-edit-data__edit">{props.children}</div>
				{props.dataValidation && <div className="gdd-edit-data__data-validation">{props.dataValidation}</div>}
			</div>
		)
	}
}
