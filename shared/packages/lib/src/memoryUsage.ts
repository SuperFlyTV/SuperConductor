/** A subset of Electron.ProcessMetric (as returned by app.getAppMetrics()) */
export interface ProcessMetricLike {
	pid: number
	type: string
	memory: {
		/** In kilobytes */
		workingSetSize: number
		/** In kilobytes. Only available on Windows */
		privateBytes?: number
	}
}

/**
 * Returns a one-line description of the current memory usage, to be logged.
 * This is useful for tracking down memory leaks, as it tells which process (and which kind of memory) is growing:
 * - main heapUsed: JavaScript objects in the main process
 * - main external / arrayBuffers: Native memory (like Buffers and native modules) in the main process
 * - processes: The total memory of each process (main = "Browser", renderer = "Tab" etc.)
 */
export function describeMemoryUsage(processMetrics: ProcessMetricLike[]): string {
	const toMB = (bytes: number) => Math.round(bytes / 1024 / 1024)

	const mem = process.memoryUsage()
	const main = `main: rss ${toMB(mem.rss)}MB, heapUsed ${toMB(mem.heapUsed)}MB, heapTotal ${toMB(
		mem.heapTotal
	)}MB, external ${toMB(mem.external)}MB, arrayBuffers ${toMB(mem.arrayBuffers)}MB`

	const processes = processMetrics
		.map((metric) => {
			const kiloBytes = metric.memory.privateBytes ?? metric.memory.workingSetSize
			return `${metric.type}(${metric.pid}): ${toMB(kiloBytes * 1024)}MB`
		})
		.join(', ')

	return `Memory usage: ${main} | processes: ${processes}`
}
