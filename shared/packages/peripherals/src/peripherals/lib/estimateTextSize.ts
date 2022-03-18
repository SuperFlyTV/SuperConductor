// Note the sizes in this file have been pre-calculated for a 100px Arial font.
/*
// Ref: https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript

function getTextWidth(text, font) {
  // re-use canvas object for better performance
  const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
  const context = canvas.getContext("2d");
  context.font = font;
  const metrics = context.measureText(text);
  return metrics.width;
}

function getCssStyle(element, prop) {
    return window.getComputedStyle(element, null).getPropertyValue(prop);
}

function getCanvasFontSize(el = document.body) {
  const fontWeight = getCssStyle(el, 'font-weight') || 'normal';
  const fontSize = getCssStyle(el, 'font-size') || '16px';
  const fontFamily = getCssStyle(el, 'font-family') || 'Times New Roman';

  return `${fontWeight} ${fontSize} ${fontFamily}`;
}
function convertArray(arr) {
    const o = {}
    arr.forEach(c => o[c[0]] = c[1])
    return o

}
convertArray('abcdefghijklmnopqrtsuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -_!"#¤%&/()=?@£$€{[]}\\?,.;:^¨~\'*'.split('').map(c => [c, getTextWidth(c, '100pt Arial')]))
*/

/** Provides a rough (but quick) estimation of the width (in pixels) of a text */
export function estimateTextWidth(txt: string, fontSize: number): number {
	let width = 0
	const scaleFactor = fontSize / 100
	for (const c of txt) {
		width += (characterWidths[c] ?? characterWidths['n']) * scaleFactor
	}
	return width
}
/** Cuts off and returns the text so that its width (in pixels) is less than maxWidth */
export function limitTextWidth(txt: string, fontSize: number, maxWidth: number): string {
	let width = 0
	let limitText = ''
	for (const c of txt) {
		const charWidth = estimateTextWidth(c, fontSize)

		if (width + charWidth < maxWidth) {
			limitText += c
			width += charWidth
		} else {
			return limitText
		}
	}

	return txt
}
/** Estimated font sizes, for an "100px Arial" font*/
const characterWidths: { [key: string]: number } = {
	'0': 55.615234375,
	'1': 55.615234375,
	'2': 55.615234375,
	'3': 55.615234375,
	'4': 55.615234375,
	'5': 55.615234375,
	'6': 55.615234375,
	'7': 55.615234375,
	'8': 55.615234375,
	'9': 55.615234375,
	a: 55.615234375,
	b: 55.615234375,
	c: 50,
	d: 55.615234375,
	e: 55.615234375,
	f: 27.783203125,
	g: 55.615234375,
	h: 55.615234375,
	i: 22.216796875,
	j: 22.216796875,
	k: 50,
	l: 22.216796875,
	m: 83.30078125,
	n: 55.615234375,
	o: 55.615234375,
	p: 55.615234375,
	q: 55.615234375,
	r: 33.30078125,
	t: 27.783203125,
	s: 50,
	u: 55.615234375,
	v: 50,
	W: 94.384765625,
	x: 50,
	y: 50,
	z: 50,
	A: 66.69921875,
	B: 66.69921875,
	C: 72.216796875,
	D: 72.216796875,
	E: 66.69921875,
	F: 61.083984375,
	G: 77.783203125,
	H: 72.216796875,
	I: 27.783203125,
	J: 50,
	K: 66.69921875,
	L: 55.615234375,
	M: 83.30078125,
	N: 72.216796875,
	O: 77.783203125,
	P: 66.69921875,
	Q: 77.783203125,
	R: 72.216796875,
	S: 66.69921875,
	T: 61.083984375,
	U: 72.216796875,
	V: 66.69921875,
	w: 72.216796875,
	X: 66.69921875,
	Y: 66.69921875,
	Z: 61.083984375,
	' ': 27.783203125,
	'-': 33.30078125,
	_: 55.615234375,
	'!': 27.783203125,
	'"': 35.498046875,
	'#': 55.615234375,
	'¤': 55.615234375,
	'%': 88.916015625,
	'&': 66.69921875,
	'/': 27.783203125,
	'(': 33.30078125,
	')': 33.30078125,
	'=': 58.3984375,
	'?': 55.615234375,
	'@': 101.513671875,
	'£': 55.615234375,
	$: 55.615234375,
	'€': 55.615234375,
	'{': 33.3984375,
	'[': 27.783203125,
	']': 27.783203125,
	'}': 33.3984375,
	'\\': 27.783203125,
	',': 27.783203125,
	'.': 27.783203125,
	';': 27.783203125,
	':': 27.783203125,
	'^': 46.923828125,
	'¨': 33.30078125,
	'~': 58.3984375,
	"'": 19.091796875,
	'*': 38.916015625,
}
