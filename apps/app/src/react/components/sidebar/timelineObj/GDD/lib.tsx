import { GDDSchema } from 'graphics-data-definition'
import _ from 'lodash'
import React from 'react'
import { TSRTimelineObj } from 'timeline-state-resolver-types'
import { OnSave } from '../timelineObjs/lib'

export function getBasicType(schemaType: string | string[]): string {
	return Array.isArray(schemaType) ? schemaType[0] : schemaType
}
export interface ComponentAnyProps<T> {
	objs: TSRTimelineObj[]
	/** Full path to the editing property */
	fullPath: string[]

	schema: T
	data: any
	onSaveObj: OnSave
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
export function getEditPropertyMeta(
	props: PropertyProps<any> & {
		inTableRow?: boolean
		className?: string
	}
): {
	schema: GDDSchema
	label: string
	description: string | undefined
} {
	const schema = props.schema as GDDSchema
	const label = schema.title || `${props.property}`
	const description = props.schema.description

	return { schema, label, description }
}
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

export function makePartialData(newData: unknown, oldData: unknown): any {
	const diff: any = {}
	makePartialDataInner(newData, oldData, diff, 'innerProp')
	return diff['innerProp']
}
function makePartialDataInner(newData: any, oldData: any, diff: any, diffKey: string): void {
	if (Array.isArray(newData)) {
		if (!Array.isArray(oldData)) diff[diffKey] = newData

		// No good way to handle arrays..
		diff[diffKey] = newData
	} else if (newData === null) {
		if (oldData !== null) diff[diffKey] = newData
	} else if (typeof newData === 'object') {
		if (typeof oldData !== 'object') diff[diffKey] = newData

		const oldKeys = oldData ? Object.keys(oldData) : [] // Handle null
		const allKeys = new Set([...Object.keys(newData), ...oldKeys])

		const innerDiff: any = {}
		for (const key of allKeys.keys()) {
			makePartialDataInner(newData[key], oldData[key], innerDiff, key)
		}
		diff[diffKey] = innerDiff
	} else if (newData !== oldData) {
		diff[diffKey] = newData
	}
}
function assert<T>(val: T, check: T) {
	if (!_.isEqual(val, check))
		throw new Error(`Assertion failed, expected ${JSON.stringify(check)} but got ${JSON.stringify(val)}`)
}
try {
	assert(makePartialData({ a: 1 }, {}), { a: 1 })
	assert(makePartialData({ a: 1, b: 2 }, { a: 1 }), { b: 2 })

	assert(makePartialData({ a: 1, b: { c: 1, d: 2 } }, { a: 1, b: { c: 1 } }), { b: { d: 2 } })
	assert(makePartialData({ a: 1, b: [] }, { a: 1 }), { b: [] })
	assert(makePartialData({ a: 1, b: [1, 2, 3] }, { a: 1 }), { b: [1, 2, 3] })

	assert(makePartialData({ a: 1 }, { a: 1, b: 2 }), { b: undefined })
	assert(makePartialData({ a: 1 }, { a: 1, b: { c: 1 } }), { b: undefined })
	assert(makePartialData({ a: null }, { a: { b: 1 } }), { a: null })
} catch (e) {
	// eslint-disable-next-line no-console
	console.log(e)
}
