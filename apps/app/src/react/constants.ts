export let DISPLAY_DECIMAL_COUNT = 0

export function setConstants(constants: { decimalCount?: number }): void {
	if (constants.decimalCount !== undefined) DISPLAY_DECIMAL_COUNT = constants.decimalCount
}
