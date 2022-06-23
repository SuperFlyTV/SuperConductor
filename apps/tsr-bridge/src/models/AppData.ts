export interface AppData {
	windowPosition: WindowPosition
	settings: AppSettings
}
export interface AppSettings {
	guiSettingsOpen: boolean

	/**
	 * True: is a server that SuperConductor connects to.
	 * False: is a client that connects to SuperConductor.
	 */
	acceptConnections: boolean

	listenPort: number

	superConductorHost: string
	bridgeId: string
}
export type WindowPosition =
	| {
			y: number
			x: number
			width: number
			height: number
			maximized: boolean
	  }
	| {
			// Note: undefined will center the window
			y: undefined
			x: undefined
			width: number
			height: number
			maximized: boolean
	  }
export interface AppSystem {
	networkAddresses: string[]
}
