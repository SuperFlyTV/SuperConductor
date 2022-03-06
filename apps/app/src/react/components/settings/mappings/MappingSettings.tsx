import React from 'react'
import { Project } from '../../../../models/project/Project'
import { Divider, Typography } from '@mui/material'
import { MappingList } from './MappingList'

export const MappingSettings: React.FC<{ project: Project }> = ({ project }) => {
	return (
		<>
			<Typography variant="h6" marginTop="3rem">
				Mappings
			</Typography>
			<Divider />

			<MappingList mappings={project.mappings} bridges={project.bridges} />
		</>
	)
}
