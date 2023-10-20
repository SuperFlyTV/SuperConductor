import { deepExtendRemovingUndefined } from '../util'

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
