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
export function literal<T>(o: T): T {
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
	const o = stringifyErrorInner(error)
	if (noStack || !o.stack) {
		return o.message
	} else {
		return `${o.message}, ${o.stack}`
	}
}
export function stringifyErrorInner(error: unknown): {
	message: string
	stack: string | undefined
} {
	let message: string | undefined = undefined
	let stack: string | undefined = undefined
	if (typeof error === 'string') {
		message = error
	} else if (error === null) {
		message = 'null'
	} else if (error === undefined) {
		message = 'undefined'
	} else if (error && typeof error === 'object') {
		if (typeof (error as any).error === 'object' && (error as any).error.message) {
			message = (error as any).error.message
			stack = (error as any).error.stack
		} else if ((error as any).reason) {
			if ((error as any).reason.message) {
				message = (error as any).reason.message
				stack = (error as any).reason.stack || (error as any).reason.reason
			} else {
				// Is a Meteor.Error
				message = (error as any).reason
				stack = (error as Error).stack
			}
		} else if ((error as Error).message) {
			// Is an Error
			message = (error as Error).message
			stack = (error as Error).stack
		} else if ((error as any).details) {
			message = (error as any).details
		} else {
			try {
				// Try to stringify the object:
				message = JSON.stringify(error)
			} catch (e) {
				// eslint-disable-next-line @typescript-eslint/no-base-to-string
				message = `${error} (stringifyError: ${e})`
			}
		}
	} else {
		// eslint-disable-next-line @typescript-eslint/no-base-to-string
		message = `${error}`
	}
	message = `${message}`

	return {
		message,
		stack,
	}
}
export function ensureArray<T>(v: T | T[]): T[] {
	return Array.isArray(v) ? v : [v]
}
/** Capitalizes the first letter of a string */
export function capitalizeFirstLetter(input: string): string {
	return input.charAt(0).toUpperCase() + input.slice(1)
}
