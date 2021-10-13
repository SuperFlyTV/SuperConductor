import { post } from './config'
import Timeline from 'superfly-timeline'

type TimelineRequest = Timeline.TimelineObject[]

export class TsrBridgeApi {
	static postTimeline = async (params: TimelineRequest) => {
		console.log('Posting timeline')
		await post<{}>(`/timeline`, params)
	}
}
