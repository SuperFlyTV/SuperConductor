import { post } from './config'
import Timeline from 'superfly-timeline'
import { Mappings } from 'timeline-state-resolver-types'

type PlayTimelineRequest = {
	id: string
	timeline: Timeline.TimelineObject[]
}
type UpdateMappingsRequest = {
	mappings: Mappings | undefined
}
type StopTimelineRequest = {
	id: string
}

export class TsrBridgeApi {
	static playTimeline = async (params: PlayTimelineRequest) => {
		return await post<{}>(`/play-timeline`, params)
	}
	static updateMappings = async (params: UpdateMappingsRequest) => {
		return await post<{}>(`/update-mappings`, params)
	}
	static stopTimeline = async (params: StopTimelineRequest) => {
		return await post<{}>(`/stop-timeline`, params)
	}
}
