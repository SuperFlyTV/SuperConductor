import type { ExtensionHostMessage } from 'src/models/GUI/ExtensionHostMessage'

export interface IPCEvents {
	message: (message: ExtensionHostMessage) => void
}

export class IPC extends EventTarget {
	constructor() {
		super()
		self.addEventListener('message', (e: MessageEvent<ExtensionHostMessage>) => {
			if (typeof e.data !== 'object' || typeof e.data?.type !== 'string')
				throw new Error('Unknown message from main thread')

			this.dispatchEvent(
				new CustomEvent('message', {
					detail: e.data,
				})
			)
		})
	}

	sendMesage = (msg: ExtensionHostMessage): void => {
		self.postMessage(msg)
	}
}
