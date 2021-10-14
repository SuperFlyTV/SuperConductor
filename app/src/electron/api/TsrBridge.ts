import { post } from './config'
import Timeline from 'superfly-timeline'

type PlayTimelineRequest = {
	id: string
	groupId: string
	newTimeline: Timeline.TimelineObject[]
}

type StopTimelineRequest = {
	id: string
}

export class TsrBridgeApi {
	static playTimeline = async (params: PlayTimelineRequest) => {
		return await post<{}>(`/play-timeline`, params)
	}
	static stopTimeline = async (params: StopTimelineRequest) => {
		return await post<{}>(`/stop-timeline`, params)
	}
}
