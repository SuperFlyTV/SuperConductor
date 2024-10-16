import { TimelineObj } from '../../models/rundown/TimelineObj.js'
import { deepExtendRemovingUndefined, deleteTimelineObj } from '../util.js'

test('deepExtendRemovingUndefined', () => {
	{
		const target = {
			a: 1,
		}
		deepExtendRemovingUndefined(target, {
			b: 2,
		})
		expect(target).toStrictEqual({ a: 1, b: 2 })
	}
	{
		const target = {
			a: [1, 2, 3],
		}
		deepExtendRemovingUndefined(target, {
			a: [4, 5, 6],
		})
		expect(target).toStrictEqual({ a: [4, 5, 6] })
	}

	{
		const target = {
			arr: [1, 2, 3],
			obj: {
				num: 1,
				arr: [
					{
						a: 1,
					},
					{
						b: 2,
					},
				],
				obj: {
					a: 1,
				},
				toBeUndefined: {
					a: 1,
				},
			},
		}
		deepExtendRemovingUndefined(target, {
			arr: [3, 4, 5],
			obj: {
				num: 2,
				arr: [
					{
						a: 2,
					},
					{
						b: 3,
					},
					{
						c: 4,
					},
				],
				obj: {
					b: 2,
				},
				toBeUndefined: undefined,
			},
		})
		expect(target).toStrictEqual({
			arr: [3, 4, 5],
			obj: {
				num: 2,
				arr: [
					{
						a: 2,
					},
					{
						b: 3,
					},
					{
						c: 4,
					},
				],
				obj: {
					a: 1,
					b: 2,
				},
			},
		})
	}
})

function makeTestObject(id: string, start: string | number): TimelineObj {
	return {
		obj: {
			content: {} as any,
			enable: {
				start,
			},
			id,
			layer: '',
		},
		resolved: {} as any,
	}
}

describe('deleteTimelineObj', () => {
	it('returns the same array if no changes', () => {
		const timeline = [makeTestObject('obj1', '#obj2.end + 500'), makeTestObject('obj2', 1000)]
		const result = deleteTimelineObj(timeline, 'obj3')
		expect(result).toBe(timeline)
	})

	it('patches dependent objects', () => {
		const timeline = [makeTestObject('obj1', '#obj2.end + 500'), makeTestObject('obj2', 1000)]
		const result = deleteTimelineObj(timeline, 'obj2')
		expect(result).toEqual([makeTestObject('obj1', '1000 + 500')]) // not great, but acceptable
	})

	it('patches dependent objects 2', () => {
		const timeline = [
			makeTestObject('obj1', '#obj2.end + 500'),
			makeTestObject('obj2', '#obj3.end'),
			makeTestObject('obj3', 0),
		]
		const result = deleteTimelineObj(timeline, 'obj2')
		expect(result).toEqual([makeTestObject('obj1', '#obj3.end + 500'), makeTestObject('obj3', 0)])
	})
})
