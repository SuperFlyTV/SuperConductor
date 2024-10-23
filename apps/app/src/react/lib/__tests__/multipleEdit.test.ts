import { isIndeterminate, getListBoolean, ListBoolean } from '../multipleEdit.js'
test('isIndeterminate', () => {
	expect(isIndeterminate([1, 1, 1], (n) => n)).toBe(false)
	expect(isIndeterminate([1, 2, 1], (n) => n)).toBe(true)
	expect(isIndeterminate([2, 1, 1], (n) => n)).toBe(true)
	expect(isIndeterminate([1, 1, 2], (n) => n)).toBe(true)
	expect(isIndeterminate([1], (n) => n)).toBe(false)
	expect(isIndeterminate([1, 2], (n) => n)).toBe(true)
})

test('getListBoolean', () => {
	expect(getListBoolean([1, 1, 1], (n) => !!n)).toBe(ListBoolean.ALL)
	expect(getListBoolean([1, 0, 1], (n) => !!n)).toBe(ListBoolean.SOME)
	expect(getListBoolean([0, 1, 1], (n) => !!n)).toBe(ListBoolean.SOME)
	expect(getListBoolean([1, 1, 0], (n) => !!n)).toBe(ListBoolean.SOME)
	expect(getListBoolean([0, 0, 0], (n) => !!n)).toBe(ListBoolean.NONE)
	expect(getListBoolean([1], (n) => !!n)).toBe(ListBoolean.ALL)
	expect(getListBoolean([0], (n) => !!n)).toBe(ListBoolean.NONE)
	expect(getListBoolean([1, 0], (n) => !!n)).toBe(ListBoolean.SOME)
})
