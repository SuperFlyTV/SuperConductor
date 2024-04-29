import { ProtectedString } from '@shared/models'

export type Extension = {
	activate: (context: ExtensionContext) => Promise<void>
	deactivate: () => Promise<void>
}

export type ExtensionName = ProtectedString<'ExtensionName'>

export interface ExtensionManifest {
	name: ExtensionName
	main?: string
	engines: Record<string, string>
	contributes: {
		commands?: IExtensionCommand[]
		views?: {
			panel?: IExtensionViewPanel[]
		}
	}
}

export type ExtensionCommandId = ProtectedString<'ExtensionCommandId'>

export interface IExtensionCommand {
	command: ExtensionCommandId
	title: string
}

export type ExtensionViewPanelId = ProtectedString<'ExtensionViewPanelId'>

export interface IExtensionViewPanel {
	id: ExtensionViewPanelId
	name: string
}

export type ExtensionContext = Record<string, never>

export interface ExtensionData {
	name: ExtensionName
	manifest: ExtensionManifest
	url: string
	filePath: string
}
