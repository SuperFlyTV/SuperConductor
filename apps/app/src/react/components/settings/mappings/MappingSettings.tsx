import React from 'react'
import { Project } from '../../../../models/project/Project'
import { MappingList } from './MappingList'

export const MappingSettings: React.FC<{ project: Project }> = ({ project }) => {
	return (
		<>
			<MappingList mappings={project.mappings} bridges={project.bridges} />
		</>
	)
}
