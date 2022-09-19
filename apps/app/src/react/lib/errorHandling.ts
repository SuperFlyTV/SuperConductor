/**
 * Wraps a callback function, and improves any errors thrown inside it.
 * This is intended to be used for functions executed in setTimeout, event handlers etc,
 * where a thrown error would be uncaught
 */
export function CB<T extends (...args: any[]) => any>(cb: T): T {
	return ((...args: any[]) => {
		try {
			return cb(...args)
		} catch (error) {
			// @ts-expect-error hack
			const handleError = window.handleError as undefined | ((error: any) => void)
			if (handleError) {
				handleError(error)
			} else {
				throw error
			}
		}
	}) as any
}
