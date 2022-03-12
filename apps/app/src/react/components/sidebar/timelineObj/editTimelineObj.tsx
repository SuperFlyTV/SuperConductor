import { assertNever } from '@shared/lib'
import React from 'react'
import {
	DeviceType,
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
	TimelineObjTCPSendAny,
	TimelineObjVIZMSEAny,
	TimelineObjVMixAny,
	TSRTimelineObj,
} from 'timeline-state-resolver-types'
import { EditTimelineObjCasparCGAny } from './timelineObjs/casparcg'
import { EditTimelineObjAbstractAny } from './timelineObjs/abstract'
import { EditTimelineObjAtemAny } from './timelineObjs/atem'
import { EditTimelineObjEmpty } from './timelineObjs/empty'
import { EditTimelineObjHTTPSendAny } from './timelineObjs/httpSend'
import { EditTimelineObjHyperdeckAny } from './timelineObjs/hyperdeck'
import { EditTimelineObjLawoAny } from './timelineObjs/lawo'
import { OnSave } from './timelineObjs/lib'
import { EditTimelineObjOBSAny } from './timelineObjs/obs'
import { EditTimelineObjOSCAny } from './timelineObjs/osc'
import { EditTimelineObjPanasonicPtzAny } from './timelineObjs/panasonic'
import { EditTimelineObjPharosAny } from './timelineObjs/pharos'
import { EditTimelineObjQuantelAny } from './timelineObjs/quantel'
import { EditTimelineObjShotoku } from './timelineObjs/shotoku'
import { EditTimelineObjSingularLiveAny } from './timelineObjs/singularLive'
import { EditTimelineObjSisyfosAny } from './timelineObjs/sisyfos'
import { EditTimelineObjTCPSendAny } from './timelineObjs/tcpSend'
import { EditTimelineObjUnknown } from './timelineObjs/unknown'
import { EditTimelineObjVIZMSEAny } from './timelineObjs/vizMSE'
import { EditTimelineObjVMixAny } from './timelineObjs/vMix'

export const EditTimelineObjContent: React.FC<{
	obj: TSRTimelineObj
	onSave: OnSave
}> = ({ obj, onSave }) => {
	let editElement: JSX.Element | null = null

	obj = JSON.parse(JSON.stringify(obj)) // clone, bacause child functions might edit it

	if (obj.content.deviceType === DeviceType.ABSTRACT && obj.content.type === 'empty') {
		editElement = <EditTimelineObjEmpty obj={obj as TimelineObjEmpty} onSave={onSave} />
	} else if (obj.content.deviceType === DeviceType.ABSTRACT) {
		editElement = <EditTimelineObjAbstractAny obj={obj as TimelineObjAbstractAny} onSave={onSave} />
	} else if (obj.content.deviceType === DeviceType.ATEM) {
		editElement = <EditTimelineObjAtemAny obj={obj as TimelineObjAtemAny} onSave={onSave} />
	} else if (obj.content.deviceType === DeviceType.CASPARCG) {
		editElement = <EditTimelineObjCasparCGAny obj={obj as TimelineObjCasparCGAny} onSave={onSave} />
	} else if (obj.content.deviceType === DeviceType.HTTPSEND) {
		editElement = <EditTimelineObjHTTPSendAny obj={obj as TimelineObjHTTPSendAny} onSave={onSave} />
	} else if (obj.content.deviceType === DeviceType.TCPSEND) {
		editElement = <EditTimelineObjTCPSendAny obj={obj as TimelineObjTCPSendAny} onSave={onSave} />
	} else if (obj.content.deviceType === DeviceType.HYPERDECK) {
		editElement = <EditTimelineObjHyperdeckAny obj={obj as TimelineObjHyperdeckAny} onSave={onSave} />
	} else if (obj.content.deviceType === DeviceType.LAWO) {
		editElement = <EditTimelineObjLawoAny obj={obj as TimelineObjLawoAny} onSave={onSave} />
	} else if (obj.content.deviceType === DeviceType.OBS) {
		editElement = <EditTimelineObjOBSAny obj={obj as TimelineObjOBSAny} onSave={onSave} />
	} else if (obj.content.deviceType === DeviceType.OSC) {
		editElement = <EditTimelineObjOSCAny obj={obj as TimelineObjOSCAny} onSave={onSave} />
	} else if (obj.content.deviceType === DeviceType.PHAROS) {
		editElement = <EditTimelineObjPharosAny obj={obj as TimelineObjPharosAny} onSave={onSave} />
	} else if (obj.content.deviceType === DeviceType.PANASONIC_PTZ) {
		editElement = <EditTimelineObjPanasonicPtzAny obj={obj as TimelineObjPanasonicPtzAny} onSave={onSave} />
	} else if (obj.content.deviceType === DeviceType.QUANTEL) {
		editElement = <EditTimelineObjQuantelAny obj={obj as TimelineObjQuantelAny} onSave={onSave} />
	} else if (obj.content.deviceType === DeviceType.SHOTOKU) {
		editElement = <EditTimelineObjShotoku obj={obj as TimelineObjShotoku} onSave={onSave} />
	} else if (obj.content.deviceType === DeviceType.SISYFOS) {
		editElement = <EditTimelineObjSisyfosAny obj={obj as TimelineObjSisyfosAny} onSave={onSave} />
	} else if (obj.content.deviceType === DeviceType.SINGULAR_LIVE) {
		editElement = <EditTimelineObjSingularLiveAny obj={obj as TimelineObjSingularLiveAny} onSave={onSave} />
	} else if (obj.content.deviceType === DeviceType.VMIX) {
		editElement = <EditTimelineObjVMixAny obj={obj as TimelineObjVMixAny} onSave={onSave} />
	} else if (obj.content.deviceType === DeviceType.VIZMSE) {
		editElement = <EditTimelineObjVIZMSEAny obj={obj as TimelineObjVIZMSEAny} onSave={onSave} />
	} else {
		assertNever(obj.content)
	}

	if (!editElement) {
		editElement = <EditTimelineObjUnknown obj={obj} onSave={onSave} />
	}

	return editElement
}
