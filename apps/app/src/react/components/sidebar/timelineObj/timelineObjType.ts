import {
	DeviceType,
	TSRTimelineObj,
	TimelineObjAbstractAny,
	TimelineObjAtemAny,
	TimelineObjCasparCGAny,
	TimelineObjEmpty,
	TimelineObjHTTPSendAny,
	TimelineObjHyperdeckAny,
	TimelineObjLawoAny,
	TimelineObjOBSAny,
	TimelineObjOSCAny,
	TimelineObjPanasonicPtzAny,
	TimelineObjPharosAny,
	TimelineObjQuantelAny,
	TimelineObjShotoku,
	TimelineObjSingularLiveAny,
	TimelineObjSisyfosAny,
	TimelineObjSofieChefAny,
	TimelineObjTCPSendAny,
	TimelineObjTelemetricsAny,
	TimelineObjVIZMSEAny,
	TimelineObjVMixAny,
} from 'timeline-state-resolver-types'
export function timelineObjIsEmpty(obj: TSRTimelineObj): obj is TimelineObjEmpty {
	return obj.content.deviceType === DeviceType.ABSTRACT && obj.content.type === 'empty'
}
export function timelineObjIsAbstractAny(obj: TSRTimelineObj): obj is TimelineObjAbstractAny {
	return obj.content.deviceType === DeviceType.ABSTRACT
}
export function timelineObjIsAtemAny(obj: TSRTimelineObj): obj is TimelineObjAtemAny {
	return obj.content.deviceType === DeviceType.ATEM
}
export function timelineObjIsCasparCGAny(obj: TSRTimelineObj): obj is TimelineObjCasparCGAny {
	return obj.content.deviceType === DeviceType.CASPARCG
}
export function timelineObjIsHTTPSendAny(obj: TSRTimelineObj): obj is TimelineObjHTTPSendAny {
	return obj.content.deviceType === DeviceType.HTTPSEND
}
export function timelineObjIsTCPSendAny(obj: TSRTimelineObj): obj is TimelineObjTCPSendAny {
	return obj.content.deviceType === DeviceType.TCPSEND
}
export function timelineObjIsHyperdeckAny(obj: TSRTimelineObj): obj is TimelineObjHyperdeckAny {
	return obj.content.deviceType === DeviceType.HYPERDECK
}
export function timelineObjIsLawoAny(obj: TSRTimelineObj): obj is TimelineObjLawoAny {
	return obj.content.deviceType === DeviceType.LAWO
}
export function timelineObjIsOBSAny(obj: TSRTimelineObj): obj is TimelineObjOBSAny {
	return obj.content.deviceType === DeviceType.OBS
}
export function timelineObjIsOSCAny(obj: TSRTimelineObj): obj is TimelineObjOSCAny {
	return obj.content.deviceType === DeviceType.OSC
}
export function timelineObjIsPharosAny(obj: TSRTimelineObj): obj is TimelineObjPharosAny {
	return obj.content.deviceType === DeviceType.PHAROS
}
export function timelineObjIsPanasonicPtzAny(obj: TSRTimelineObj): obj is TimelineObjPanasonicPtzAny {
	return obj.content.deviceType === DeviceType.PANASONIC_PTZ
}
export function timelineObjIsQuantelAny(obj: TSRTimelineObj): obj is TimelineObjQuantelAny {
	return obj.content.deviceType === DeviceType.QUANTEL
}
export function timelineObjIsShotoku(obj: TSRTimelineObj): obj is TimelineObjShotoku {
	return obj.content.deviceType === DeviceType.SHOTOKU
}
export function timelineObjIsSisyfosAny(obj: TSRTimelineObj): obj is TimelineObjSisyfosAny {
	return obj.content.deviceType === DeviceType.SISYFOS
}
export function timelineObjIsSingularLiveAny(obj: TSRTimelineObj): obj is TimelineObjSingularLiveAny {
	return obj.content.deviceType === DeviceType.SINGULAR_LIVE
}
export function timelineObjIsVMixAny(obj: TSRTimelineObj): obj is TimelineObjVMixAny {
	return obj.content.deviceType === DeviceType.VMIX
}
export function timelineObjIsVIZMSEAny(obj: TSRTimelineObj): obj is TimelineObjVIZMSEAny {
	return obj.content.deviceType === DeviceType.VIZMSE
}
export function timelineObjIsSofieChefAny(obj: TSRTimelineObj): obj is TimelineObjSofieChefAny {
	return obj.content.deviceType === DeviceType.SOFIE_CHEF
}
export function timelineObjIsTelemetricsAny(obj: TSRTimelineObj): obj is TimelineObjTelemetricsAny {
	return obj.content.deviceType === DeviceType.TELEMETRICS
}
