import { assertNever } from '@shared/lib'
import { isEqual } from 'lodash-es'

/** Returns the first value in a list */
export function firstValue<T, V>(objects: T[], fcn: (obj: T) => V): V | undefined {
	if (!objects.length) return undefined
	return fcn(objects[0])
}
/** Returns true if any of the values differ from eachother */
export function isIndeterminate<T>(objects: T[], fcn: (obj: T) => any): boolean {
	if (objects.length === 0) return false
	if (objects.length === 1) return false

	const firstValue = fcn(objects[0])
	for (let i = objects.length - 1; i > 0; i--) {
		if (!isEqual(fcn(objects[i]), firstValue)) return true
	}
	return false
}

/** Describes a list of boolean values */
export enum ListBoolean {
	/** All values are true */
	ALL = 'all',
	/** Some values are true, others are false */
	SOME = 'some',
	/** All values are false */
	NONE = 'none',
}
/** Goes through a list of objects and determines if all values are equal or not */
export function getListBoolean<T>(objects: T[], fcn: (obj: T) => boolean): ListBoolean {
	if (objects.length === 0) return ListBoolean.NONE // undefined

	const firstValue: boolean = fcn(objects[0])
	for (const obj of objects) {
		if (fcn(obj) !== firstValue) return ListBoolean.SOME
	}
	return firstValue ? ListBoolean.ALL : ListBoolean.NONE
}

export function allAreTrue<T>(objects: T[], fcn: (obj: T) => boolean): boolean {
	return getListBoolean(objects, fcn) === ListBoolean.ALL
}
export function anyAreTrue<T>(objects: T[], fcn: (obj: T) => boolean): boolean {
	const lb = getListBoolean(objects, fcn)
	return lb === ListBoolean.ALL || lb === ListBoolean.SOME
}
/**
 * Convenience method, returns the proper label depending on the result of getListBoolean()
 * @param labels [Label for ALL, Label for SOME, Label for NONE]
 */
export function getListBooleanLabels<T>(
	objects: T[],
	fcn: (obj: T) => boolean,
	labels: [string, string, string]
): string {
	const listBoolean = getListBoolean(objects, fcn)
	if (listBoolean === ListBoolean.ALL) return labels[0]
	if (listBoolean === ListBoolean.SOME) return labels[1]
	if (listBoolean === ListBoolean.NONE) return labels[2]
	assertNever(listBoolean)
	return 'N/A'
}
/** Convenience method, used in Input fields */
export function inputValue<T, V, DefaultV>(
	objects: T[],
	fcn: (obj: T) => V | undefined,
	defaultValue: DefaultV
): { currentValue: V | DefaultV; indeterminate: boolean } {
	const fValue = firstValue(objects, fcn)
	return {
		currentValue: fValue === undefined ? defaultValue : fValue,
		indeterminate: isIndeterminate(objects, fcn),
	}
}
