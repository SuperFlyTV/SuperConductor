import React from 'react'
import { BridgeStatus } from '../../../models/project/Bridge'
import { Project } from '../../../models/project/Project'
import { BridgesSettings } from './BridgesSettings'
import { MappingSettings } from './mappings/MappingSettings'
import { ProjectSettings } from './ProjectSettings'

interface ISettingsProps {
	project: Project
	bridgeStatuses: { [bridgeId: string]: BridgeStatus }
}

export const Settings: React.FC<ISettingsProps> = ({ project, bridgeStatuses }) => {
	return (
		<div className="settings">
			<ProjectSettings project={project} />
			<BridgesSettings project={project} bridgeStatuses={bridgeStatuses} />
			<MappingSettings project={project} />
		</div>
	)
}
