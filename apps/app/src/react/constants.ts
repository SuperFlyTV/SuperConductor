/** How many decimals to show in the GUI */
export let DISPLAY_DECIMAL_COUNT = 0

/** In Expression Parts, max duration to show */
export let DISPLAY_EXPRESSION_MAX_DURATION = 30 * 1000

export function setConstants(constants: { decimalCount?: number }): void {
	if (constants.decimalCount !== undefined) DISPLAY_DECIMAL_COUNT = constants.decimalCount
}
