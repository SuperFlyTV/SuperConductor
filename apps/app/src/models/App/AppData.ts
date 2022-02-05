export interface AppData {
	windowPosition: WindowPosition
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
	  }
	| {
			// Note: undefined will center the window
			y: undefined
			x: undefined
			width: number
			height: number
	  }
