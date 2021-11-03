export const APP_FEED_CHANNEL = 'app-feed'
export const PLAY_RUNDOWN_CHANNEL = 'play-rundown'
export const STOP_RUNDOWN_CHANNEL = 'stop-rundown'
export const SELECT_TIMELINE_OBJ_CHANNEL = 'select-timeline-obj'
export const UPDATE_TIMELINE_OBJ_CHANNEL = 'update-timeline-obj'
export const NEW_RUNDOWN_CHANNEL = 'new-rundown'
export const DELETE_RUNDOWN_CHANNEL = 'delete-rundown'
export const NEW_TEMPLATE_DATA_CHANNEL = 'new-template-data'
export const UPDATE_TEMPLATE_DATA_CHANNEL = 'update-template-data'
export const DELETE_TEMPLATE_DATA_CHANNEL = 'delete-template-data'
export const DELETE_TIMELINE_OBJ_CHANNEL = 'delete-timeline-obj'
export const ADD_MEDIA_TO_TIMELINE_CHANNEL = 'add-media-to-timeline'
export const ADD_TEMPLATE_TO_TIMELINE_CHANNEL = 'add-template-to-timeline'

export interface IUpdateTimelineObj {
	id: string
	enableStart: number
	enableDuration: number
	layer: string | number
}

export interface INewRundown {
	name: string
}

export interface IDeleteRundown {
	id: string
}

export interface INewTemplateDataChannel {
	timelineObjId: string
}

export interface IUpdateTemplateDataChannel {
	timelineObjId: string
	key: string
	changedItemId: string
	value: string
}

export interface IDeleteTemplateDataChannel {
	timelineObjId: string
	key: string
}

export interface IDeleteTimelineObjChannel {
	timelineObjId: string
}

export interface IAddMediaToTimelineChannel {
	rundownId: string
	layerId: string
	filename: string
}

export interface IAddTemplateToTimelineChannel {
	rundownId: string
	layerId: string
	filename: string
}
