import React, { useContext } from 'react'
import { Mapping } from 'timeline-state-resolver-types'
import { ScListItemLabel } from '../scList/ScListItemLabel.js'
import { describeMappingConfiguration } from '../../../../../lib/TSRMappings.js'
import { DeviceIcon } from '../deviceIcon/DeviceIcon.js'
import './style.scss'
import { ProjectContext } from '../../../../contexts/Project.js'
import { getDeviceName, getMappingName } from '../../../../../lib/util.js'
import { TSRDeviceId } from '@shared/models'

export const LayerItemHeader: React.FC<{
	id: string
	mapping: Mapping
	deviceId: TSRDeviceId
}> = (props) => {
	const project = useContext(ProjectContext)
	const mappingDescription = describeMappingConfiguration(props.mapping)
	return (
		<div className="layer-item-header">
			<ScListItemLabel title={getMappingName(props.mapping, props.id)} />
			<DeviceIcon type={props.mapping.device} />
			<ScListItemLabel title={getDeviceName(project, props.deviceId)} />
			{mappingDescription && <div className="config-description">{mappingDescription}</div>}
		</div>
	)
}
