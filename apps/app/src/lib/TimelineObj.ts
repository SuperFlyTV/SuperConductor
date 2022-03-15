import {
	DeviceType,
	TimelineContentTypeAtem,
	TimelineContentTypeCasparCg,
	TSRTimelineObj,
} from 'timeline-state-resolver-types'
import { parseMs } from '@shared/lib'

export function describeTimelineObject(obj: TSRTimelineObj, duration?: number) {
	let label: string = obj.id
	if (obj.content.deviceType === DeviceType.CASPARCG) {
		if (obj.content.type === TimelineContentTypeCasparCg.MEDIA) {
			label = obj.content.file
		} else if (obj.content.type === TimelineContentTypeCasparCg.TEMPLATE) {
			label = obj.content.name
		} else {
			// todo: for later:
			// assertNever(obj.content)
		}
	} else if (obj.content.deviceType === DeviceType.ATEM) {
		if (obj.content.type === TimelineContentTypeAtem.ME) {
			label = `ATEM Input ${obj.content.me.input}`
		}
	} else {
		// todo: for later:
		// assertNever(obj.content)
	}

	// @ts-expect-error type
	const type: string = obj.content.type
	const contentTypeClassNames: string[] = [`device-${DeviceType[obj.content.deviceType]}`, type]

	let parsedDuration: ReturnType<typeof parseMs> | null = null
	if (typeof duration === 'number') {
		parsedDuration = parseMs(duration)
	}

	return {
		label,
		contentTypeClassNames,
		parsedDuration,
	}
}
