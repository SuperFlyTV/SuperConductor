import copy from 'fast-copy'

export function last<T>(arr: T[]): T | undefined {
	return arr[arr.length - 1]
}
export function first<T>(arr: T[]): T | undefined {
	return arr[0]
}
/** Remove all falsy values from array */
export function compact<T>(arr: (T | undefined | null | false)[]): T[] {
	return arr.filter(Boolean) as T[]
}
/**
 * Helper function to simply assert that the value is of the type never.
 * Usage: at the end of if/else or switch, to ensure that there is no fallthrough.
 */
export function assertNever(_value: never): void {
	// does nothing
}
export function omit<T, K extends keyof T>(obj: T, arg: K): Omit<T, K> {
	const copy = { ...obj }
	delete copy[arg]
	return copy
}
export function deepClone<T>(data: T): T {
	return copy(data)
}
export function literal<T>(o: T) {
	return o
}
export function flatten<T>(arr: (T | T[])[]): T[] {
	const arr2: T[] = []
	for (const v of arr) {
		if (Array.isArray(v)) {
			for (const v2 of v) {
				arr2.push(v2)
			}
		} else {
			arr2.push(v)
		}
	}
	return arr2
}
/** Make a string out of an error (or other equivalents), including any additional data such as stack trace if available */
export function stringifyError(error: unknown, noStack = false): string {
	let str: string | undefined = undefined

	if (error && typeof error === 'object') {
		if ((error as Error).message) {
			// Is an Error
			str = `${(error as Error).message}`
		} else if ((error as any).reason) {
			// Is a Meteor.Error
			str = `${(error as any).reason}`
		} else if ((error as any).details) {
			str = `${(error as any).details}`
		} else {
			try {
				// Try to stringify the object:
				str = JSON.stringify(error)
			} catch (e) {
				str = `${error} (stringifyError: ${e})`
			}
		}
	} else {
		str = `${error}`
	}

	if (!noStack) {
		if (error && typeof error === 'object' && (error as any).stack) {
			str += ', ' + (error as any).stack
		}
	}

	return str
}
export function ensureArray<T>(v: T | T[]): T[] {
	return Array.isArray(v) ? v : [v]
}
