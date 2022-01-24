import { DeviceType, TimelineContentTypeCasparCg, TSRTimelineObj } from 'timeline-state-resolver-types'

export function describeTimelineObject(obj: TSRTimelineObj) {
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
	} else {
		// todo: for later:
		// assertNever(obj.content)
	}

	// @ts-expect-error type
	const type: string = obj.content.type
	const contentTypeClassNames: string[] = [`device-${DeviceType[obj.content.deviceType]}`, type]

	return {
		label,
		contentTypeClassNames,
	}
}
