import React from 'react'
import { Project } from '../../../models/project/Project'
import { BridgesSettings } from './BridgesSettings'
import { MappingSettings } from './mappings/MappingSettings'
import { ProjectSettings } from './ProjectSettings'

interface ISettingsProps {
	project: Project
}

export const Settings: React.FC<ISettingsProps> = ({ project }) => {
	return (
		<div className="settings">
			<ProjectSettings project={project} />
			<BridgesSettings project={project} />
			<MappingSettings project={project} />
		</div>
	)
}
