import { sleep } from '@shared/lib'
/**
 * Will call fcn() on an interval. If fcn takes longer than one interval, will skip the missed call(s) and continue.
 */
export function asyncInterval(
	fcn: () => Promise<void>,
	intervalMs: number,
	onError: (e: unknown) => void
): { stop: () => void } {
	let running = true

	setImmediate(() => {
		const runner = async () => {
			while (running) {
				const startTime = Date.now()
				await fcn()

				const execDuration = Date.now() - startTime

				// If execDuration is more than intervalMs, skip the missed call(s) and continue:
				const timeToNext = intervalMs - (execDuration % intervalMs)

				await sleep(timeToNext)
			}
		}
		runner().catch(onError)
	})

	return {
		stop: () => {
			running = false
		},
	}
}
