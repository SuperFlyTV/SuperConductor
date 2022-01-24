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
	return JSON.parse(JSON.stringify(data))
}
