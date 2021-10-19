export const APP_FEED_CHANNEL = 'app-feed'
export const PLAY_RUNDOWN_CHANNEL = 'play-rundown'
export const STOP_RUNDOWN_CHANNEL = 'stop-rundown'
export const SELECT_TIMELINE_OBJ_CHANNEL = 'select-timeline-obj'
export const UPDATE_TIMELINE_OBJ_CHANNEL = 'update-timeline-obj'

export type UpdateTimelineObj = {
	id: string
	enableStart: number
	enableDuration: number
}
