export function HSVtoRGB(arg: { h: number; s: number; v: number }): { r: number; g: number; b: number } {
	// https://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately
	let r
	let g
	let b

	const h = arg.h
	const s = arg.s
	const v = arg.v

	const i = Math.floor(h * 6)
	const f = h * 6 - i
	const p = v * (1 - s)
	const q = v * (1 - f * s)
	const t = v * (1 - (1 - f) * s)
	switch (i % 6) {
		case 0: {
			r = v
			g = t
			b = p
			break
		}
		case 1: {
			r = q
			g = v
			b = p
			break
		}
		case 2: {
			r = p
			g = v
			b = t
			break
		}
		case 3: {
			r = p
			g = q
			b = v
			break
		}
		case 4: {
			r = t
			g = p
			b = v
			break
		}
		case 5: {
			r = v
			g = p
			b = q
			break
		}
		default:
			throw new Error('Internal error in HSVtoRGB')
	}
	return {
		r: Math.round(r * 255),
		g: Math.round(g * 255),
		b: Math.round(b * 255),
	}
}
export function RGBToString(rgb: { r: number; g: number; b: number }): string {
	const r = (rgb.r < 16 ? '0' : '') + Math.floor(rgb.r).toString(16)
	const g = (rgb.g < 16 ? '0' : '') + Math.floor(rgb.g).toString(16)
	const b = (rgb.b < 16 ? '0' : '') + Math.floor(rgb.b).toString(16)

	return '#' + r + g + b
}
export function stringToRGB(rgb: string): { r: number; g: number; b: number } {
	const m = rgb.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
	if (m) {
		return {
			r: parseInt(m[1], 16),
			g: parseInt(m[2], 16),
			b: parseInt(m[3], 16),
		}
	} else {
		const m = rgb.match(/^#?([0-9a-f]{1})([0-9a-f]{1})([0-9a-f]{1})$/i)
		if (m) {
			return {
				r: parseInt(m[1] + m[1], 16),
				g: parseInt(m[2] + m[2], 16),
				b: parseInt(m[3] + m[3], 16),
			}
		}
	}

	return { r: 0, g: 0, b: 0 }
}
