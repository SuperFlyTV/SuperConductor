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
})
