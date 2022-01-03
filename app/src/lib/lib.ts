export function last<T>(arr: T[]): T | undefined {
	return arr[arr.length - 1]
}
export function first<T>(arr: T[]): T | undefined {
	return arr[0]
}
/** Helper function to simply assert that the value is of the type never */
export function assertNever(_value: never): void {
	// does nothing
}
export function omit<T, K extends keyof T>(obj: T, arg: K): Omit<T, K> {
	const copy = { ...obj }
	delete copy[arg]
	return copy
}
