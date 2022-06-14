import _ from 'lodash'
import { computed } from 'mobx'
import { useMemo, useRef } from 'react'

/** Variant of useMemo, useful when memoizing objects computed from a mobx store */
export function useMemoComputedObject<T extends object | any[] | string | number | boolean | null | undefined>(
	fcn: () => T,
	deps: React.DependencyList
): T {
	const ref = useRef<T>()
	return useMemo(() => {
		return computed<T>(() => {
			const value: T = fcn()
			if (!_.isEqual(value, ref.current)) {
				ref.current = value
			}
			return ref.current as T
		})
	}, deps).get()
}
/** Variant of useMemo, useful when memoizing values computed from a mobx store */
export function useMemoComputedValue<T extends string | number | boolean | null | undefined>(
	fcn: () => T,
	deps: React.DependencyList
): T {
	return useMemo(() => {
		return computed<T>(fcn, {})
	}, deps).get()
}
export function useMemoObject<T extends object | any[] | string | number | boolean | null | undefined>(
	fcn: () => T,
	deps: React.DependencyList
): T {
	const ref = useRef<T>()
	return useMemo(() => {
		const value: T = fcn()
		if (!_.isEqual(value, ref.current)) {
			ref.current = value
		}
		return ref.current as T
	}, deps)
}
