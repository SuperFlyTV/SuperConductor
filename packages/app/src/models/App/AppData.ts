export interface AppData {
	windowPosition: WindowPosition
	project: {
		fileName: string
	}
	rundowns: {
		fileName: string
	}[]
}
export type WindowPosition =
	| {
			y: number
			x: number
			width: number
			height: number
	  }
	| {
			// Note: undefined will center the window
			y: undefined
			x: undefined
			width: number
			height: number
	  }
