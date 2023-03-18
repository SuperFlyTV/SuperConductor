import { assertNever } from '@shared/lib'
import React from 'react'
import { TSRTimelineObj } from 'timeline-state-resolver-types'
import { EditTimelineObjCasparCGAny } from './timelineObjs/casparcg'
import { EditTimelineObjAbstractAny } from './timelineObjs/abstract'
import { EditTimelineObjAtemAny } from './timelineObjs/atem'
import { EditTimelineObjEmpty } from './timelineObjs/empty'
import { EditTimelineObjHTTPSendAny } from './timelineObjs/httpSend'
import { EditTimelineObjHyperdeckAny } from './timelineObjs/hyperdeck'
import { EditTimelineObjLawoAny } from './timelineObjs/lawo'
import { EditTimelineObjProps, OnSave } from './timelineObjs/lib'
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
import {
	timelineObjIsEmpty,
	timelineObjIsAbstractAny,
	timelineObjIsAtemAny,
	timelineObjIsCasparCGAny,
	timelineObjIsHTTPSendAny,
	timelineObjIsTCPSendAny,
	timelineObjIsHyperdeckAny,
	timelineObjIsLawoAny,
	timelineObjIsOBSAny,
	timelineObjIsOSCAny,
	timelineObjIsPharosAny,
	timelineObjIsPanasonicPtzAny,
	timelineObjIsQuantelAny,
	timelineObjIsShotoku,
	timelineObjIsSisyfosAny,
	timelineObjIsSingularLiveAny,
	timelineObjIsVMixAny,
	timelineObjIsVIZMSEAny,
	timelineObjIsSofieChefAny,
	timelineObjIsTelemetricsAny,
} from './timelineObjType'

export const EditTimelineObjContent: React.FC<{
	obj: TSRTimelineObj
	isExpression: boolean
	onSave: OnSave
}> = ({ obj, isExpression, onSave }) => {
	let editElement: JSX.Element | null = null

	obj = JSON.parse(JSON.stringify(obj)) // clone, bacause child functions might edit it

	const innerProps: Omit<EditTimelineObjProps<any>, 'obj'> = {
		isExpression,
		onSave,
	}

	if (timelineObjIsEmpty(obj)) {
		editElement = <EditTimelineObjEmpty obj={obj} {...innerProps} />
	} else if (timelineObjIsAbstractAny(obj)) {
		editElement = <EditTimelineObjAbstractAny obj={obj} {...innerProps} />
	} else if (timelineObjIsAtemAny(obj)) {
		editElement = <EditTimelineObjAtemAny obj={obj} {...innerProps} />
	} else if (timelineObjIsCasparCGAny(obj)) {
		editElement = <EditTimelineObjCasparCGAny obj={obj} {...innerProps} />
	} else if (timelineObjIsHTTPSendAny(obj)) {
		editElement = <EditTimelineObjHTTPSendAny obj={obj} {...innerProps} />
	} else if (timelineObjIsTCPSendAny(obj)) {
		editElement = <EditTimelineObjTCPSendAny obj={obj} {...innerProps} />
	} else if (timelineObjIsHyperdeckAny(obj)) {
		editElement = <EditTimelineObjHyperdeckAny obj={obj} {...innerProps} />
	} else if (timelineObjIsLawoAny(obj)) {
		editElement = <EditTimelineObjLawoAny obj={obj} {...innerProps} />
	} else if (timelineObjIsOBSAny(obj)) {
		editElement = <EditTimelineObjOBSAny obj={obj} {...innerProps} />
	} else if (timelineObjIsOSCAny(obj)) {
		editElement = <EditTimelineObjOSCAny obj={obj} {...innerProps} />
	} else if (timelineObjIsPharosAny(obj)) {
		editElement = <EditTimelineObjPharosAny obj={obj} {...innerProps} />
	} else if (timelineObjIsPanasonicPtzAny(obj)) {
		editElement = <EditTimelineObjPanasonicPtzAny obj={obj} {...innerProps} />
	} else if (timelineObjIsQuantelAny(obj)) {
		editElement = <EditTimelineObjQuantelAny obj={obj} {...innerProps} />
	} else if (timelineObjIsShotoku(obj)) {
		editElement = <EditTimelineObjShotoku obj={obj} {...innerProps} />
	} else if (timelineObjIsSisyfosAny(obj)) {
		editElement = <EditTimelineObjSisyfosAny obj={obj} {...innerProps} />
	} else if (timelineObjIsSingularLiveAny(obj)) {
		editElement = <EditTimelineObjSingularLiveAny obj={obj} {...innerProps} />
	} else if (timelineObjIsVMixAny(obj)) {
		editElement = <EditTimelineObjVMixAny obj={obj} {...innerProps} />
	} else if (timelineObjIsVIZMSEAny(obj)) {
		editElement = <EditTimelineObjVIZMSEAny obj={obj} {...innerProps} />
	} else if (timelineObjIsSofieChefAny(obj)) {
		editElement = <EditTimelineObjSofieChefAny obj={obj} {...innerProps} />
	} else if (timelineObjIsTelemetricsAny(obj)) {
		editElement = <EditTimelineObjTelemetricsAny obj={obj} {...innerProps} />
	} else {
		assertNever(obj)
	}

	if (!editElement) {
		editElement = <EditTimelineObjUnknown obj={obj} {...innerProps} />
	}

	return editElement
}
