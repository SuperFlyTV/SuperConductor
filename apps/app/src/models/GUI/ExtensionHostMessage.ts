import { ExtensionManifest, ExtensionName } from './Extension'

interface AbstractExtensionHostMessage {
	type: string
}

export interface ActivateExtensionMessage extends AbstractExtensionHostMessage {
	type: 'activateExtension'
	name: ExtensionName
	url: string
	manifest: ExtensionManifest
}

export interface DeactivateExtensionMessage extends AbstractExtensionHostMessage {
	type: 'deactivateExtension'
	name: ExtensionName
}

export type ExtensionHostMessage = ActivateExtensionMessage | DeactivateExtensionMessage
