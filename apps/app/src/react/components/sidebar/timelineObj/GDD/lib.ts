import { GDDSchema } from 'graphics-data-definition'
import { TSRTimelineContent, TSRTimelineObj } from 'timeline-state-resolver-types'
import { OnSave } from '../timelineObjs/lib.js'

export function getBasicType(schemaType: string | string[]): string {
	return Array.isArray(schemaType) ? schemaType[0] : schemaType
}
export interface ComponentAnyProps<T> {
	objs: TSRTimelineObj<TSRTimelineContent>[]
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
