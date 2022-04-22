import React from 'react'
import { Mapping } from 'timeline-state-resolver-types'
import { ScListItemLabel } from '../scList/ScListItemLabel'
import { describeMappingConfiguration, getDeviceName } from '../../../../../lib/TSRMappings'
import { DeviceIcon } from '../deviceIcon/DeviceIcon'
import './style.scss'

export const LayerItemHeader: React.FC<{
	id: string
	mapping: Mapping
}> = (props) => {
	const mappingDescription = describeMappingConfiguration(props.mapping)
	return (
		<div className="layer-item-header">
			<ScListItemLabel title={props.mapping.layerName || ''} subtitle={props.id} />
			<DeviceIcon type={props.mapping.device} />
			<ScListItemLabel title={getDeviceName(props.mapping.device) || ''} subtitle={`${props.mapping.deviceId}`} />
			{mappingDescription && <div className="config-description">{mappingDescription}</div>}
		</div>
	)
}
