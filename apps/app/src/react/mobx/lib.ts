import _ from 'lodash'
import { computed } from 'mobx'
import { useMemo, useRef } from 'react'

let DEBUG = false

/**
 * Enable debugging of changed values.
 *
 * @returns
 */
export function gebugCustomMemos(enable = true) {
	DEBUG = enable

	const stackPrepare = new Error('')
	let endWasCalled = false
	setImmediate(() => {
		if (!endWasCalled) {
			// eslint-disable-next-line no-console
			console.error(
				`enableDebugging end() was not called! You should call it at the end of your React hook!`,
				stackPrepare?.stack
			)
		}
	})

	return {
		end: () => {
			endWasCalled = true
			DEBUG = false
		},
	}
}

/** Variant of useMemo, useful when memoizing objects computed from a mobx store */
export function useMemoComputedObject<T extends object | any[] | string | number | boolean | null | undefined>(
	fcn: (prev: T | undefined) => T,
	deps: React.DependencyList,
	/** true: only update if the value has changed. false: update if identify changed */
	equalValue?: boolean
): T {
	const debug = DEBUG
	const errPrepare = new Error(
		'useMemoComputedObject: new object is identical to the old one! useMemoComputedObject requires a cloned object'
	)
	const stackPrepare = debug ? new Error('') : undefined
	const ref = useRef<T>()
	return useMemo(() => {
		return computed<T>(() => {
			const value: T = fcn(equalValue ? undefined : ref.current)
			if (equalValue) {
				if (value === ref.current && typeof value === 'object' && value !== null) {
					// eslint-disable-next-line no-console
					console.error(value)
					throw errPrepare
				}
				if (!_.isEqual(value, ref.current)) {
					// eslint-disable-next-line no-console
					if (debug) console.error('useMemoComputedObject update', stackLine(stackPrepare, 2))

					ref.current = value
				}
				return ref.current as T
			} else {
				return value
			}
		})
	}, deps).get()
}
/** Variant of useMemo, useful when memoizing values computed from a mobx store */
export function useMemoComputedValue<T extends string | number | boolean | null | undefined>(
	fcn: () => T,
	deps: React.DependencyList
): T {
	const debug = DEBUG
	const stackPrepare = debug ? new Error('') : undefined
	const value = useMemo(() => {
		return computed<T>(fcn, {})
	}, deps).get()
	// eslint-disable-next-line no-console
	if (debug) console.error('useMemoComputedValue update', stackLine(stackPrepare, 2))

	return value
}
/** Variant of useMemo, useful when memoizing arrays computed from a mobx store */
export function useMemoComputedArray<T>(fcn: () => T[], deps: React.DependencyList): T[] {
	const debug = DEBUG
	const errPrepare = new Error(
		'useMemoArray: new array is identical to the old one! useMemoArray requires a cloned object'
	)
	const stackPrepare = debug ? new Error('') : undefined
	const ref = useRef<T[]>([])
	return useMemo(() => {
		return computed<T[]>(() => {
			const resultArray: T[] = []

			const oldValues: T[] = ref.current
			const newValues: T[] = fcn()

			if (newValues === oldValues) throw errPrepare

			let isTheSame = true
			if (oldValues.length !== newValues.length) isTheSame = false

			for (let i = 0; i < newValues.length; i++) {
				const newValue = newValues[i]
				const oldValue = oldValues[i]

				if (_.isEqual(newValue, oldValue)) {
					resultArray.push(oldValue)
				} else {
					resultArray.push(newValue)
					isTheSame = false
				}
			}
			if (!isTheSame) {
				// eslint-disable-next-line no-console
				if (debug) console.error('useMemoComputedArray update', stackLine(stackPrepare, 2))
				ref.current = resultArray
			}

			return ref.current
		})
	}, deps).get()
}
/**
 * Variant of useMemo, to be used when memoizing Objects.
 * If the resulting object is deeply equal (value-wise), returns the original (identical) object
 */
export function useMemoObject<T extends object | any[] | string | number | boolean | null | undefined>(
	fcn: () => T,
	deps: React.DependencyList,
	equalValue?: boolean
): T {
	const debug = DEBUG
	const errPrepare = new Error(
		'useMemoObject: new object is identical to the old one! useMemoObject requires a cloned object'
	)
	const stackPrepare = debug ? new Error('') : undefined
	const ref = useRef<T>()
	return useMemo(() => {
		const value: T = fcn()

		if (equalValue) {
			if (value === ref.current && typeof value === 'object' && value !== null) throw errPrepare
			if (!_.isEqual(value, ref.current)) {
				// eslint-disable-next-line no-console
				if (debug) console.error('useMemoObject update', stackLine(stackPrepare, 2))
				ref.current = value
			}
			return ref.current as T
		} else {
			return value
		}
	}, deps)
}
/**
 * Variant of useMemo, to be used when memoizing arrays.
 * If the resulting Array is deeply equal (value-wise), returns the original (identical) array.
 * Otherwise, if an value in the Array (at the same index) is deeply equal (value-wise), returns the original (identical) value.
 */
export function useMemoArray<T>(fcn: () => T[], deps: React.DependencyList): T[] {
	const errPrepare = new Error(
		'useMemoArray: new array is identical to the old one! useMemoArray requires a cloned object'
	)
	const ref = useRef<T[]>([])
	return useMemo<T[]>(() => {
		const resultArray: T[] = []

		const oldValues: T[] = ref.current
		const newValues: T[] = fcn()

		if (newValues === oldValues) throw errPrepare

		let isTheSame = true
		if (oldValues.length !== newValues.length) isTheSame = false

		for (let i = 0; i < newValues.length; i++) {
			const newValue = newValues[i]
			const oldValue = oldValues[i]

			if (_.isEqual(newValue, oldValue)) {
				resultArray.push(oldValue)
			} else {
				resultArray.push(newValue)
				isTheSame = false
			}
		}
		if (!isTheSame) {
			ref.current = resultArray
		}

		return ref.current
	}, deps)
}
export function assign<T extends { [key: string]: any }>(
	org: T,
	apply: T,
	deep: true | false | undefined = undefined,
	handleKeys?:
		| {
				[key in keyof T]?: () => true | false | void
		  }
): void {
	const allKeys: string[] = _.uniq([...Object.keys(org), ...Object.keys(apply)])

	for (const key of allKeys) {
		let strategy: true | false | undefined = deep
		const handle = handleKeys?.[key]
		if (handle !== undefined) {
			const result = handle()
			if (result === true) {
				// assign deeply
				strategy = true
			} else if (result === false) {
				// assign shallow
				strategy = false
			} else if (result === undefined) {
				continue
			}
		}

		if (org[key] !== apply[key]) {
			if (strategy === undefined && (typeof org[key] === 'object' || typeof apply[key] === 'object')) {
				// eslint-disable-next-line no-console
				console.error(
					new Error(
						`warning: assign: "${key}" is an object. Set deep to true or false to remove this warning`
					)
				)
			}
			if (typeof org[key] === 'object' && typeof apply[key] === 'object') {
				if (strategy === true) {
					// deeply extend content:
					if (Array.isArray(org[key]) && Array.isArray(apply[key])) {
						assignArray(org[key], apply[key])
					} else {
						assign(org[key], apply[key])
					}
				} else {
					// replace content:
					if (!_.isEqual(org[key], apply[key])) {
						;(org as any)[key] = apply[key]
					}
				}
			} else {
				;(org as any)[key] = apply[key]
			}
		}
	}
}
export function assignPartial<T extends { [key: string]: any }, K extends keyof T>(
	org: T,
	apply: Partial<T>,
	...omitKeys: Array<K>
): void {
	for (const key of Object.keys(apply)) {
		if (omitKeys.includes(key as K)) continue
		if (org[key] !== apply[key]) {
			;(org as any)[key] = apply[key]
		}
	}
}
/**
 * Syncronizes the contents of two array.
 * If an item has moved, it'll be moved instead of replaces.
 * @returns an array corresponding to the resulting array, containing information about the changes.
 */
export function assignArray<T>(org: T[], apply: T[], isEqual?: (a: T, b: T) => boolean): AssignOperation<T>[] {
	if (!isEqual) isEqual = _.isEqual
	const results: AssignOperation<T>[] = []

	for (let i = 0; i < apply.length; i++) {
		const orgItem = org[i] as T | undefined

		if (!orgItem) {
			// Item is missing in org, add it:
			org.splice(i, 0, apply[i])
			results.push({ op: 'insert', incoming: apply[i] })
			continue
		}
		if (isEqual(orgItem, apply[i])) {
			// They are equal, so do nothing
			results.push({ op: 'equal', org: orgItem, incoming: apply[i] })
			continue
		}

		// See if it's a case of an element has moved to this position?
		let foundIndex = -1
		for (let j = i + 1; j < org.length; j++) {
			if (isEqual(orgItem, apply[j])) {
				foundIndex = j
				break
			}
		}
		if (foundIndex !== -1) {
			// Move the element to this position:
			const foundItem = org.splice(foundIndex, 1)[0]
			org.splice(i, 0, foundItem)
			results.push({ op: 'move', org: foundItem, incoming: apply[i] })
			continue
		}

		// Otherwise, just insert the element:
		org.splice(i, 0, apply[i])
		results.push({ op: 'insert', incoming: apply[i] })
	}

	// At the end, remove any extra elements:
	org.splice(apply.length, org.length - apply.length)

	return results
}
type AssignOperation<T> =
	| {
			incoming: T
			op: 'insert'
	  }
	| {
			org: T
			incoming: T
			op: 'move' | 'equal'
	  }

function stackLine(err: Error | undefined, lineIndex: number): string | undefined {
	if (!err) return undefined
	const stack = err.stack
	if (!stack) return undefined
	const lines = stack.split('\n')
	return lines[lineIndex]
}
