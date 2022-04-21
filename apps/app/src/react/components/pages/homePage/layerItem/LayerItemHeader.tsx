/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react'
import { Mapping } from 'timeline-state-resolver-types'
import { ScListItemLabel } from '../scList/ScListItemLabel'
import { describeMappingConfiguration, getDeviceName } from '../../../../../lib/TSRMappings'

import './style.scss'
import { DeviceShortcut } from '../deviceShorcut/DeviceShortcut'
import { DeviceIcon } from '../deviceIcon/DeviceIcon'
import { MappingList } from 'src/react/components/settings/mappings/MappingList'

export const LayerItemHeader: React.FC<{
	id: string
	mapping: Mapping
}> = (props) => {
	return (
		<div className="layer-item-header">
			<ScListItemLabel title={props.mapping.layerName || ''} subtitle={props.id} />
			<DeviceIcon type={props.mapping.device} />
			<ScListItemLabel title={getDeviceName(props.mapping.device) || ''} subtitle={`${props.mapping.deviceId}`} />
			<div className="config-description">{describeMappingConfiguration(props.mapping)}</div>
		</div>
	)
}
