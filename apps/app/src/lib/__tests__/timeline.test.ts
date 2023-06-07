import { TimelineObjectInstance } from 'superfly-timeline'
import { areInstancesOverlapping } from '../timeline'
test('areInstancesOverlapping', () => {
	function i(start: number, end: number | null, id: string = ''): TimelineObjectInstance {
		return {
			id,
			start,
			end,
			references: [],
		}
	}

	expect(areInstancesOverlapping(i(100, 200), i(0, 50))).toBe(false)
	expect(areInstancesOverlapping(i(100, 200), i(0, 110))).toBe(true)
	expect(areInstancesOverlapping(i(100, 200), i(110, 120))).toBe(true)
	expect(areInstancesOverlapping(i(100, 200), i(110, 250))).toBe(true)
	expect(areInstancesOverlapping(i(100, 200), i(250, 300))).toBe(false)
	expect(areInstancesOverlapping(i(100, 200), i(250, Infinity))).toBe(false)

	expect(areInstancesOverlapping(i(100, Infinity), i(0, 100))).toBe(false)
	expect(areInstancesOverlapping(i(100, Infinity), i(0, 101))).toBe(true)
	expect(areInstancesOverlapping(i(100, Infinity), i(0, Infinity))).toBe(true)
	expect(areInstancesOverlapping(i(100, Infinity), i(150, Infinity))).toBe(true)
})
