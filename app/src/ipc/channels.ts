export const APP_FEED_CHANNEL = 'app-feed'
export const PLAY_RUNDOWN_CHANNEL = 'play-rundown'
export const STOP_RUNDOWN_CHANNEL = 'stop-rundown'
export const SELECT_TIMELINE_OBJ_CHANNEL = 'select-timeline-obj'
export const UPDATE_TIMELINE_OBJ_CHANNEL = 'update-timeline-obj'
export const NEW_RUNDOWN_CHANNEL = 'new-rundown'

export interface IUpdateTimelineObj {
	id: string
	enableStart: number
	enableDuration: number
}

export interface INewRundown {
	name: string
}
