import { ApplicationTrigger } from '../rundown/Trigger'

export interface AppData {
	windowPosition: WindowPosition
	version: {
		/** The version of the SuperConductor that the user has seen */
		seenVersion: string | null
		/** The version of the SuperConductor who saved the data*/
		currentVersion: string
		/** Wether the current version is a pre-release or not */
		currentVersionIsPrerelease: boolean
	}
	/** Which version of the user agreement the user has agreed to  */
	userAgreement?: string

	/**
	 * If the application should update to the latest pre-release.
	 * When undefined, it's treated as true if the current version is a pre-release, false otherwise
	 */
	preReleaseAutoUpdate?: boolean

	/** How many decimals to use in the GUI, defaults to 0 */
	guiDecimalCount?: number

	project: {
		id: string
	}
	rundowns: {
		[fileName: string]: {
			name: string
			open: boolean
		}
	}
	triggers: {
		[Key in ApplicationTrigger['action']]?: ApplicationTrigger[]
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
