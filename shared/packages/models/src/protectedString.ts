/* eslint-disable @typescript-eslint/ban-types */

/** Runtime-wise, this is a string.
 * In compile-time, this is used to make sure that the "right" string is provided, typings-wise,
 * in order to provide stringer typings.
 */
export interface ProtectedString<T> {
	_protectedType: T
}
export type ProtectedStringProperties<T, K extends keyof T> = {
	[P in keyof T]: P extends K ? ProtectedString<any> : T[P]
}
export function protectString<T extends ProtectedString<any>>(str: string): T
export function protectString<T extends ProtectedString<any>>(str: string | null): T | null
export function protectString<T extends ProtectedString<any>>(str: string | undefined): T | undefined
export function protectString<T extends ProtectedString<any>>(str: string | undefined | null): T | undefined | null {
	return str as any as T
}
export function protectStringArray<T extends ProtectedString<any>>(arr: string[]): T[] {
	return arr as any as T[]
}
export function protectStringObject<O extends object, Props extends keyof O>(
	obj: O
): ProtectedStringProperties<O, Props> {
	return obj as any as ProtectedStringProperties<O, Props>
}
export function unprotectString(protectedStr: ProtectedString<any>): string
export function unprotectString(protectedStr: ProtectedString<any> | null): string | null
export function unprotectString(protectedStr: ProtectedString<any> | undefined): string | undefined
export function unprotectString(protectedStr: ProtectedString<any> | undefined | null): string | undefined | null {
	return protectedStr as any as string
}
export function unprotectStringArray(protectedStrs: Array<ProtectedString<any>>): string[] {
	return protectedStrs as any as string[]
}
/** Used on protectedStrings instead of _.isString or typeof x === 'string' */
export function isProtectedString(str: unknown): str is ProtectedString<any> {
	return typeof str === 'string'
}
export type ProtectId<T extends { _id: string }> = Omit<T, '_id'> & { _id: ProtectedString<any> }
export type UnprotectedStringProperties<T extends object | undefined> = {
	[P in keyof T]: T[P] extends ProtectedString<any>
		? string
		: T[P] extends ProtectedString<any> | undefined
		? string | undefined
		: T[P] extends object
		? UnprotectedStringProperties<T[P]>
		: T[P] extends object | undefined
		? UnprotectedStringProperties<T[P]>
		: T[P]
}
export function unprotectObject<T extends object>(obj: T): UnprotectedStringProperties<T>
export function unprotectObject<T extends object>(obj: T | undefined): UnprotectedStringProperties<T> | undefined
export function unprotectObject(obj: undefined): undefined
export function unprotectObject<T extends object>(obj: T | undefined): UnprotectedStringProperties<T> | undefined {
	return obj as any
}
export function unprotectObjectArray<T extends object>(obj: T[]): UnprotectedStringProperties<T>[]
export function unprotectObjectArray<T extends object>(obj: readonly T[]): readonly UnprotectedStringProperties<T>[]
export function unprotectObjectArray<T extends object>(obj: T[] | readonly T[]): UnprotectedStringProperties<T>[] {
	return obj as any
}
export function isStringOrProtectedString<T extends ProtectedString<any>>(val: unknown): val is string | T {
	return typeof val === 'string'
}
