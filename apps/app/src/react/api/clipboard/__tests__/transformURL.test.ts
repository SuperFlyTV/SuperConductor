import { transformURL } from '../transformURL.js'

describe('transformURL', () => {
	test('Youtube video', () => {
		{
			const u = transformURL(new URL('https://www.youtube.com/watch?v=abcdefg'))
			expect(u.href).toBe(
				'https://www.youtube.com/embed/abcdefg?autoplay=true&loop=1&showinfo=0&controls=0&modestbranding=1'
			)
		}
		{
			const u = transformURL(new URL('https://www.youtube.com/watch?v=asdf&t=10m14s'))
			expect(u.href).toBe(
				'https://www.youtube.com/embed/asdf?start=614&autoplay=true&loop=1&showinfo=0&controls=0&modestbranding=1'
			)
		}
	})
	test('Any other url', () => {
		// Any other url should not be transformed:
		const otherURL = 'https://superfly.tv/qwerty/asdf?a=1&b=2&c=3'
		const u = transformURL(new URL(otherURL))
		expect(u.href).toBe(otherURL)
	})
})
