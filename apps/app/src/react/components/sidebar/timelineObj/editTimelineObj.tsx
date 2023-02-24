import { assertNever, compact } from '@shared/lib'
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
	TimelineObjSofieChefAny,
	TimelineObjTCPSendAny,
	TimelineObjTelemetricsAny,
	TimelineObjVIZMSEAny,
	TimelineObjVMixAny,
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
import { EditTimelineObjSofieChefAny } from './timelineObjs/sofieChef'
import { EditTimelineObjTelemetricsAny } from './timelineObjs/telemetrics'
import { TimelineObj } from '../../../../models/rundown/TimelineObj'
import { firstValue, isIndeterminate } from '../../../lib/multipleEdit'

export const EditTimelineObjContent: React.FC<{
	modifiableObjects: {
		groupId: string
		partId: string
		timelineObj: TimelineObj
		groupOrPartLocked?: boolean | undefined
	}[]
	onSave: OnSave
}> = ({ modifiableObjects, onSave }) => {
	let editElement: JSX.Element | null = null

	const indeterminate =
		isIndeterminate(modifiableObjects, (o) => o.timelineObj.obj.content.deviceType) ||
		isIndeterminate(modifiableObjects, (o) => (o.timelineObj.obj.content as any).type)
	const firstObj = firstValue(modifiableObjects, (o) => o.timelineObj.obj)

	if (!firstObj) return null

	if (indeterminate) {
		return <div>-- Different types --</div>
	}
	const objs = modifiableObjects.map((o) => o.timelineObj.obj)
	const resourceIds = compact(modifiableObjects.map((o) => o.timelineObj.resourceId))

	if (firstObj.content.deviceType === DeviceType.ABSTRACT && firstObj.content.type === 'empty') {
		editElement = <EditTimelineObjEmpty objs={objs as TimelineObjEmpty[]} onSave={onSave} />
	} else if (firstObj.content.deviceType === DeviceType.ABSTRACT) {
		editElement = <EditTimelineObjAbstractAny objs={objs as TimelineObjAbstractAny[]} onSave={onSave} />
	} else if (firstObj.content.deviceType === DeviceType.ATEM) {
		editElement = <EditTimelineObjAtemAny objs={objs as TimelineObjAtemAny[]} onSave={onSave} />
	} else if (firstObj.content.deviceType === DeviceType.CASPARCG) {
		editElement = (
			<EditTimelineObjCasparCGAny
				objs={objs as TimelineObjCasparCGAny[]}
				resourceIds={resourceIds}
				onSave={onSave}
			/>
		)
	} else if (firstObj.content.deviceType === DeviceType.HTTPSEND) {
		editElement = <EditTimelineObjHTTPSendAny objs={objs as TimelineObjHTTPSendAny[]} onSave={onSave} />
	} else if (firstObj.content.deviceType === DeviceType.TCPSEND) {
		editElement = <EditTimelineObjTCPSendAny objs={objs as TimelineObjTCPSendAny[]} onSave={onSave} />
	} else if (firstObj.content.deviceType === DeviceType.HYPERDECK) {
		editElement = <EditTimelineObjHyperdeckAny objs={objs as TimelineObjHyperdeckAny[]} onSave={onSave} />
	} else if (firstObj.content.deviceType === DeviceType.LAWO) {
		editElement = <EditTimelineObjLawoAny objs={objs as TimelineObjLawoAny[]} onSave={onSave} />
	} else if (firstObj.content.deviceType === DeviceType.OBS) {
		editElement = <EditTimelineObjOBSAny objs={objs as TimelineObjOBSAny[]} onSave={onSave} />
	} else if (firstObj.content.deviceType === DeviceType.OSC) {
		editElement = <EditTimelineObjOSCAny objs={objs as TimelineObjOSCAny[]} onSave={onSave} />
	} else if (firstObj.content.deviceType === DeviceType.PHAROS) {
		editElement = <EditTimelineObjPharosAny objs={objs as TimelineObjPharosAny[]} onSave={onSave} />
	} else if (firstObj.content.deviceType === DeviceType.PANASONIC_PTZ) {
		editElement = <EditTimelineObjPanasonicPtzAny objs={objs as TimelineObjPanasonicPtzAny[]} onSave={onSave} />
	} else if (firstObj.content.deviceType === DeviceType.QUANTEL) {
		editElement = <EditTimelineObjQuantelAny objs={objs as TimelineObjQuantelAny[]} onSave={onSave} />
	} else if (firstObj.content.deviceType === DeviceType.SHOTOKU) {
		editElement = <EditTimelineObjShotoku objs={objs as TimelineObjShotoku[]} onSave={onSave} />
	} else if (firstObj.content.deviceType === DeviceType.SISYFOS) {
		editElement = <EditTimelineObjSisyfosAny objs={objs as TimelineObjSisyfosAny[]} onSave={onSave} />
	} else if (firstObj.content.deviceType === DeviceType.SINGULAR_LIVE) {
		editElement = <EditTimelineObjSingularLiveAny objs={objs as TimelineObjSingularLiveAny[]} onSave={onSave} />
	} else if (firstObj.content.deviceType === DeviceType.VMIX) {
		editElement = <EditTimelineObjVMixAny objs={objs as TimelineObjVMixAny[]} onSave={onSave} />
	} else if (firstObj.content.deviceType === DeviceType.VIZMSE) {
		editElement = <EditTimelineObjVIZMSEAny objs={objs as TimelineObjVIZMSEAny[]} onSave={onSave} />
	} else if (firstObj.content.deviceType === DeviceType.SOFIE_CHEF) {
		editElement = <EditTimelineObjSofieChefAny objs={objs as TimelineObjSofieChefAny[]} onSave={onSave} />
	} else if (firstObj.content.deviceType === DeviceType.TELEMETRICS) {
		editElement = <EditTimelineObjTelemetricsAny objs={objs as TimelineObjTelemetricsAny[]} onSave={onSave} />
	} else {
		assertNever(firstObj.content)
	}

	if (!editElement) {
		editElement = <EditTimelineObjUnknown objs={objs} onSave={onSave} />
	}

	return editElement
}
