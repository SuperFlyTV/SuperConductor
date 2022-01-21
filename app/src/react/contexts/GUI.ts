import React from 'react'

/** Used to keep track of various GUI-only states */
export const GUIContext = React.createContext<{
	gui: GUI
	updateGUI: (newGui: Partial<GUI>) => void
}>({
	gui: {
		selectedTimelineObjIds: [],
	},
	updateGUI: () => {},
})

export interface GUI {
	selectedGroupId?: string
	selectedPartId?: string
	selectedTimelineObjIds: string[]
}
