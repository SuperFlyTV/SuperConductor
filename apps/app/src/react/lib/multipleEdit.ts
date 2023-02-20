import { assertNever } from '@shared/lib'
import _ from 'lodash'

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
		if (!_.isEqual(fcn(objects[i]), firstValue)) return true
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
	return {
		currentValue: firstValue(objects, fcn) ?? defaultValue,
		indeterminate: isIndeterminate(objects, fcn),
	}
}

// Unit tests:
function assert<T>(val: T, check: T) {
	if (!_.isEqual(val, check))
		throw new Error(`Assertion failed, expected ${JSON.stringify(check)} but got ${JSON.stringify(val)}`)
}
assert(
	isIndeterminate([1, 1, 1], (n) => n),
	false
)
assert(
	isIndeterminate([1, 2, 1], (n) => n),
	true
)
assert(
	isIndeterminate([2, 1, 1], (n) => n),
	true
)
assert(
	isIndeterminate([1, 1, 2], (n) => n),
	true
)
assert(
	isIndeterminate([1], (n) => n),
	false
)
assert(
	isIndeterminate([1, 2], (n) => n),
	true
)
