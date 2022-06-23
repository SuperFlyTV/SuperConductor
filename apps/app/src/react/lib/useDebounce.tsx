import { useState, useEffect } from 'react'

/** Debounce an input value for `delay` amount of time, until `value` settles. */
export function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState(value)

	/** This will run any time value or delay changes */
	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value)
		}, delay)

		/** Clear the timeout if value changes or the component is unmounted */
		return () => {
			clearTimeout(handler)
		}
	}, [value, delay])

	return debouncedValue
}
