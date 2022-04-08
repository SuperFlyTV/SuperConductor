import _ from 'lodash'
import { computed } from 'mobx'
import { useMemo } from 'react'

/** Variant of useMemo, useful when memoizing objects computed from a mobx store */
export function useMemoComputedObject<T extends object | any[] | string | number | boolean | null | undefined>(
	fcn: () => T,
	deps: React.DependencyList
): T {
	return useMemo(() => {
		return computed<T>(fcn, {
			equals: _.isEqual,
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
