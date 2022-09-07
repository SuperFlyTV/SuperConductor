export interface AppData {
	windowPosition: WindowPosition
	version: {
		/** The version of the SuperConductor that the user has seen */
		seenVersion: string | null
		/** The version of the SuperConductor who saved the data*/
		currentVersion: string
	}
	/** Which version of the user agreement the user has agreed to  */
	userAgreement?: string
	project: {
		id: string
	}
	rundowns: {
		[fileName: string]: {
			name: string
			open: boolean
		}
	}
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
