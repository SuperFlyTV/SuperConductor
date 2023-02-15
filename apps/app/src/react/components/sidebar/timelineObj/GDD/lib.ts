export function getBasicType(schemaType: string | string[]): string {
	return Array.isArray(schemaType) ? schemaType[0] : schemaType
}
