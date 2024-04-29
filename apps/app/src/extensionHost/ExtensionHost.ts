/* eslint-disable node/no-unsupported-features/es-syntax */
import type { Extension, ExtensionContext, ExtensionManifest, ExtensionName } from 'src/models/GUI/Extension'
import type { IPC } from './IPC'
import type { ExtensionHostMessage } from 'src/models/GUI/ExtensionHostMessage'

export class ExtensionHost {
	private extensionImpls: Map<ExtensionName, Extension> = new Map()

	constructor(private ipc: IPC) {
		// noop
	}

	private createExtensionContext = async (_manifest: ExtensionManifest): Promise<ExtensionContext> => {
		return {}
	}

	activateExtension = async (url: string, name: ExtensionName, manifest: ExtensionManifest): Promise<void> => {
		const impl = (await import(url)) as Extension
		if (!impl.activate || !impl.deactivate) throw new Error(`Extension "${name}" cannot be activated`)

		await impl.activate(await this.createExtensionContext(manifest))
		this.extensionImpls.set(name, impl)
	}

	deactivateExtension = async (name: ExtensionName): Promise<void> => {
		const impl = this.extensionImpls.get(name)
		if (!impl) throw new Error(`Extension "${name}" not found`)

		await impl.deactivate()
	}

	private runTask = (fnc: () => Promise<void>) => {
		fnc().catch((err) => {
			console.error(err)
		})
	}

	private handleMessage = (messageEvent: Event) => {
		if (!(messageEvent instanceof CustomEvent)) throw new Error('Unknown message')
		const message = messageEvent.detail
		this.assertExtensionHostMessage(message)
		switch (message.type) {
			case 'activateExtension':
				this.runTask(async () => this.activateExtension(message.url, message.name, message.manifest))
				break
			case 'deactivateExtension':
				this.runTask(async () => this.deactivateExtension(message.name))
				break
		}
	}

	private assertExtensionHostMessage(eventDetail: any): eventDetail is ExtensionHostMessage {
		if (typeof eventDetail.type === 'string') return true
		throw new Error(`Unknown event`, eventDetail)
	}

	listen = (): void => {
		this.ipc.addEventListener('message', this.handleMessage)
	}
}
