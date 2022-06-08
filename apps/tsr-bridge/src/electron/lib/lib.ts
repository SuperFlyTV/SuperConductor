import shortUUID from 'short-uuid'

export function shortID(): string {
	return shortUUID.generate().slice(0, 8)
}
