import React from 'react'

/** Used to keep track of various GUI-only states */
export const GUIContext = React.createContext<{
	gui: GUI
	updateGUI: (newGui: Partial<GUI>) => void
}>({
	gui: {
		selectedTimelineObjIds: [],
	},
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	updateGUI: () => {},
})

export interface GUI {
	selectedGroupId?: string
	selectedPartId?: string
	selectedTimelineObjIds: string[]
}
