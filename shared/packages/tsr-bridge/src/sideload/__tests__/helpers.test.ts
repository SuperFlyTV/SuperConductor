import { parseCasparFramerate, durationFromFrames, frameTimeFromFrames } from '../helpers.js'

describe('CasparCG helpers', () => {
	test('parse simple fps', () => {
		expect(parseCasparFramerate(30)).toBe(30)
		expect(parseCasparFramerate(60)).toBe(60)
	})

	test('parse fps*1000', () => {
		expect(parseCasparFramerate(30000)).toBeCloseTo(30)
		expect(parseCasparFramerate(59940)).toBeCloseTo(59.94)
	})

	test('parse fps*1001 (ntsc)', () => {
		expect(parseCasparFramerate(30030)).toBeCloseTo(29.97, 2)
	})

	test('duration from frames', () => {
		expect(durationFromFrames(300, 30000)).toBeCloseTo(10)
		expect(durationFromFrames(2997, 30030)).toBeGreaterThan(49)
	})

	test('frameTime from frames', () => {
		const ft = frameTimeFromFrames(3601 * 30 + 5, 30)
		expect(ft.startsWith('01:00:01')).toBeTruthy()
	})
})
