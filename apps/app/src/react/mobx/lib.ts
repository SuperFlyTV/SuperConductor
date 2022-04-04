import _ from 'lodash'
import { computed } from 'mobx'
import { useMemo } from 'react'

/** Variant of useMemo, useful when memoizing objects computed from a mobx store */
export function useMemoComputedObject<T extends object>(fcn: () => T, deps: React.DependencyList): T {
	return useMemo(() => {
		console.log('aaa')
		return computed<T>(fcn, {
			equals: _.isEqual,
		})
	}, deps).get()
}
