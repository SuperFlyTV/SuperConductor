import { makePartialData } from '../lib'

test('makePartialData', () => {
	expect(makePartialData({ a: 1 }, {})).toStrictEqual({ a: 1 })
	expect(makePartialData({ a: 1, b: 2 }, { a: 1 })).toStrictEqual({ b: 2 })

	expect(makePartialData({ a: 1, b: { c: 1, d: 2 } }, { a: 1, b: { c: 1 } })).toStrictEqual({ b: { d: 2 } })
	expect(makePartialData({ a: 1, b: [] }, { a: 1 })).toStrictEqual({ b: [] })
	expect(makePartialData({ a: 1, b: [1, 2, 3] }, { a: 1 })).toStrictEqual({ b: [1, 2, 3] })

	expect(makePartialData({ a: 1 }, { a: 1, b: 2 })).toStrictEqual({ b: undefined })
	expect(makePartialData({ a: 1 }, { a: 1, b: { c: 1 } })).toStrictEqual({ b: undefined })
	expect(makePartialData({ a: null }, { a: { b: 1 } })).toStrictEqual({ a: null })
})
