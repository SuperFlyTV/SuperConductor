import { assertNever, compact, getResourceIdFromTimelineObj } from '@shared/lib'
import React from 'react'
import {
	DeviceType,
	TSRTimelineObj,
	TimelineContentAbstractAny,
	TimelineContentAtemAny,
	TimelineContentCasparCGAny,
	TimelineContentEmpty,
	TimelineContentHTTPSendAny,
	TimelineContentHyperdeckAny,
	TimelineContentLawoAny,
	TimelineContentOBSAny,
	TimelineContentOSCAny,
	TimelineContentPanasonicPtzAny,
	TimelineContentPharosAny,
	TimelineContentQuantelAny,
	TimelineContentShotoku,
	TimelineContentSingularLiveAny,
	TimelineContentSisyfosAny,
	TimelineContentSofieChefAny,
	TimelineContentTCPSendAny,
	TimelineContentTelemetricsAny,
	TimelineContentTriCasterAny,
	TimelineContentVIZMSEAny,
	TimelineContentVMixAny,
} from 'timeline-state-resolver-types'
import { EditTimelineObjCasparCGAny } from './timelineObjs/casparcg.js'
import { EditTimelineObjAbstractAny } from './timelineObjs/abstract.js'
import { EditTimelineObjAtemAny } from './timelineObjs/atem.js'
import { EditTimelineObjEmpty } from './timelineObjs/empty.js'
import { EditTimelineObjHTTPSendAny } from './timelineObjs/httpSend.js'
import { EditTimelineObjHyperdeckAny } from './timelineObjs/hyperdeck.js'
import { EditTimelineObjLawoAny } from './timelineObjs/lawo.js'
import { OnSave } from './timelineObjs/lib.js'
import { EditTimelineObjOBSAny } from './timelineObjs/obs.js'
import { EditTimelineObjOSCAny } from './timelineObjs/osc.js'
import { EditTimelineObjPanasonicPtzAny } from './timelineObjs/panasonic.js'
import { EditTimelineObjPharosAny } from './timelineObjs/pharos.js'
import { EditTimelineObjQuantelAny } from './timelineObjs/quantel.js'
import { EditTimelineObjShotoku } from './timelineObjs/shotoku.js'
import { EditTimelineObjSingularLiveAny } from './timelineObjs/singularLive.js'
import { EditTimelineObjSisyfosAny } from './timelineObjs/sisyfos.js'
import { EditTimelineObjTCPSendAny } from './timelineObjs/tcpSend.js'
import { EditTimelineObjUnknown } from './timelineObjs/unknown.js'
import { EditTimelineObjVIZMSEAny } from './timelineObjs/vizMSE.js'
import { EditTimelineObjVMixAny } from './timelineObjs/vMix.js'
import { EditTimelineObjSofieChefAny } from './timelineObjs/sofieChef.js'
import { EditTimelineObjTelemetricsAny } from './timelineObjs/telemetrics.js'
import { TimelineObj } from '../../../../models/rundown/TimelineObj.js'
import { firstValue, isIndeterminate } from '../../../lib/multipleEdit.js'
import { EditTimelineObjTriCasterAny } from './timelineObjs/tricaster.js'
import { store } from '../../../mobx/store.js'
import { observer } from 'mobx-react-lite'

export const EditTimelineObjContent: React.FC<{
	modifiableObjects: {
		groupId: string
		partId: string
		timelineObj: TimelineObj
		groupOrPartLocked?: boolean | undefined
	}[]
	onSave: OnSave
}> = observer(function EditTimelineObjContent({ modifiableObjects, onSave }) {
	let editElement: JSX.Element | null = null

	const indeterminate =
		isIndeterminate(modifiableObjects, (o) => o.timelineObj.obj.content.deviceType) ||
		isIndeterminate(modifiableObjects, (o) => (o.timelineObj.obj.content as any).type)
	const firstObj = firstValue(modifiableObjects, (o) => o.timelineObj.obj)
	const mappings = store.projectStore.project.mappings

	if (!firstObj) return null

	if (indeterminate) {
		return <div>-- Different types --</div>
	}
	const objs = modifiableObjects.map((o) => o.timelineObj.obj)
	const resourceIds = compact(modifiableObjects.map((o) => getResourceIdFromTimelineObj(o.timelineObj.obj, mappings)))

	if (
		firstObj.content.deviceType === DeviceType.ABSTRACT &&
		'type' in firstObj.content &&
		firstObj.content.type === 'empty'
	) {
		editElement = <EditTimelineObjEmpty objs={objs as TSRTimelineObj<TimelineContentEmpty>[]} onSave={onSave} />
	} else if (firstObj.content.deviceType === DeviceType.ABSTRACT) {
		editElement = (
			<EditTimelineObjAbstractAny objs={objs as TSRTimelineObj<TimelineContentAbstractAny>[]} onSave={onSave} />
		)
	} else if (firstObj.content.deviceType === DeviceType.ATEM) {
		editElement = <EditTimelineObjAtemAny objs={objs as TSRTimelineObj<TimelineContentAtemAny>[]} onSave={onSave} />
	} else if (firstObj.content.deviceType === DeviceType.CASPARCG) {
		editElement = (
			<EditTimelineObjCasparCGAny
				objs={objs as TSRTimelineObj<TimelineContentCasparCGAny>[]}
				resourceIds={resourceIds}
				onSave={onSave}
			/>
		)
	} else if (firstObj.content.deviceType === DeviceType.HTTPSEND) {
		editElement = (
			<EditTimelineObjHTTPSendAny objs={objs as TSRTimelineObj<TimelineContentHTTPSendAny>[]} onSave={onSave} />
		)
	} else if (firstObj.content.deviceType === DeviceType.TCPSEND) {
		editElement = (
			<EditTimelineObjTCPSendAny objs={objs as TSRTimelineObj<TimelineContentTCPSendAny>[]} onSave={onSave} />
		)
	} else if (firstObj.content.deviceType === DeviceType.HYPERDECK) {
		editElement = (
			<EditTimelineObjHyperdeckAny objs={objs as TSRTimelineObj<TimelineContentHyperdeckAny>[]} onSave={onSave} />
		)
	} else if (firstObj.content.deviceType === DeviceType.LAWO) {
		editElement = <EditTimelineObjLawoAny objs={objs as TSRTimelineObj<TimelineContentLawoAny>[]} onSave={onSave} />
	} else if (firstObj.content.deviceType === DeviceType.OBS) {
		editElement = <EditTimelineObjOBSAny objs={objs as TSRTimelineObj<TimelineContentOBSAny>[]} onSave={onSave} />
	} else if (firstObj.content.deviceType === DeviceType.OSC) {
		editElement = <EditTimelineObjOSCAny objs={objs as TSRTimelineObj<TimelineContentOSCAny>[]} onSave={onSave} />
	} else if (firstObj.content.deviceType === DeviceType.PHAROS) {
		editElement = (
			<EditTimelineObjPharosAny objs={objs as TSRTimelineObj<TimelineContentPharosAny>[]} onSave={onSave} />
		)
	} else if (firstObj.content.deviceType === DeviceType.PANASONIC_PTZ) {
		editElement = (
			<EditTimelineObjPanasonicPtzAny
				objs={objs as TSRTimelineObj<TimelineContentPanasonicPtzAny>[]}
				onSave={onSave}
			/>
		)
	} else if (firstObj.content.deviceType === DeviceType.QUANTEL) {
		editElement = (
			<EditTimelineObjQuantelAny objs={objs as TSRTimelineObj<TimelineContentQuantelAny>[]} onSave={onSave} />
		)
	} else if (firstObj.content.deviceType === DeviceType.SHOTOKU) {
		editElement = <EditTimelineObjShotoku objs={objs as TSRTimelineObj<TimelineContentShotoku>[]} onSave={onSave} />
	} else if (firstObj.content.deviceType === DeviceType.SISYFOS) {
		editElement = (
			<EditTimelineObjSisyfosAny objs={objs as TSRTimelineObj<TimelineContentSisyfosAny>[]} onSave={onSave} />
		)
	} else if (firstObj.content.deviceType === DeviceType.SINGULAR_LIVE) {
		editElement = (
			<EditTimelineObjSingularLiveAny
				objs={objs as TSRTimelineObj<TimelineContentSingularLiveAny>[]}
				onSave={onSave}
			/>
		)
	} else if (firstObj.content.deviceType === DeviceType.VMIX) {
		editElement = <EditTimelineObjVMixAny objs={objs as TSRTimelineObj<TimelineContentVMixAny>[]} onSave={onSave} />
	} else if (firstObj.content.deviceType === DeviceType.VIZMSE) {
		editElement = (
			<EditTimelineObjVIZMSEAny objs={objs as TSRTimelineObj<TimelineContentVIZMSEAny>[]} onSave={onSave} />
		)
	} else if (firstObj.content.deviceType === DeviceType.SOFIE_CHEF) {
		editElement = (
			<EditTimelineObjSofieChefAny objs={objs as TSRTimelineObj<TimelineContentSofieChefAny>[]} onSave={onSave} />
		)
	} else if (firstObj.content.deviceType === DeviceType.TELEMETRICS) {
		editElement = (
			<EditTimelineObjTelemetricsAny
				objs={objs as TSRTimelineObj<TimelineContentTelemetricsAny>[]}
				onSave={onSave}
			/>
		)
	} else if (firstObj.content.deviceType === DeviceType.TRICASTER) {
		editElement = (
			<EditTimelineObjTriCasterAny objs={objs as TSRTimelineObj<TimelineContentTriCasterAny>[]} onSave={onSave} />
		)
	} else {
		assertNever(firstObj.content)
	}

	if (!editElement) {
		editElement = <EditTimelineObjUnknown objs={objs} onSave={onSave} />
	}

	return editElement
})
