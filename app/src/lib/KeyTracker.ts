import EventEmitter from 'events'

class KeyTracker extends EventEmitter {
	private downKeys: { [key: string]: true } = {}

	constructor() {
		super()
		window.onkeydown = (e) => {
			const key = e.key.toLowerCase()

			this.downKeys[key] = true
			this.emit('key', key, true)
			this.emit('keydown', key)
		}
		window.onkeyup = (e) => {
			const key = e.key.toLowerCase()

			delete this.downKeys[key]
			this.emit('key', key, false)
			this.emit('keyup', key)
		}
	}

	isKeyDown(key: string): boolean {
		return this.downKeys[key]
	}
}

export function getKeyTracker(): KeyTracker {
	return singleton
}
export function setupKeyTracker() {
	// nothing needs to be done, it's already set up
}
const singleton = new KeyTracker()
