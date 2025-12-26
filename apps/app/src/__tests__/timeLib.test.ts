import { formatDurationLabeled } from '../lib/timeLib.js'

describe('timeLib.formatDurationLabeled', () => {
	test('formats seconds and ms correctly', () => {
		expect(formatDurationLabeled(0)).toBe('0s')
		expect(formatDurationLabeled(1500)).toContain('1s')
		expect(formatDurationLabeled(50)).toContain('50ms')
	})
})
