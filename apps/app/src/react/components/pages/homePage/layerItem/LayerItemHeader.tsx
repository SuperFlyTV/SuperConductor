import React, { useContext } from 'react'
import { Mapping } from 'timeline-state-resolver-types'
import { ScListItemLabel } from '../scList/ScListItemLabel'
import { describeMappingConfiguration } from '../../../../../lib/TSRMappings'
import { DeviceIcon } from '../deviceIcon/DeviceIcon'
import './style.scss'
import { ProjectContext } from '../../../../contexts/Project'
import { getDeviceName } from '../../../../../lib/util'

export const LayerItemHeader: React.FC<{
	id: string
	mapping: Mapping
	deviceId: string
}> = (props) => {
	const project = useContext(ProjectContext)
	const mappingDescription = describeMappingConfiguration(props.mapping)
	return (
		<div className="layer-item-header">
			<ScListItemLabel title={props.mapping.layerName || 'Untitled'} />
			<DeviceIcon type={props.mapping.device} />
			<ScListItemLabel title={getDeviceName(project, props.deviceId)} />
			{mappingDescription && <div className="config-description">{mappingDescription}</div>}
		</div>
	)
}
