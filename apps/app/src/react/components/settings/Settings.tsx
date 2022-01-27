import React from 'react'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs'
import { Project } from '../../../models/project/Project'
import { BridgesSettings } from './BridgesSettings'
import { MappingSettings } from './MappingSettings'
import { ProjectSettings } from './ProjectSettings'

export const Settings: React.FC<{ project: Project }> = ({ project }) => {
	return (
		<Tabs>
			<TabList>
				<Tab>Project Settings</Tab>
				<Tab>Mappings</Tab>
				<Tab>Bridges</Tab>
			</TabList>

			<TabPanel>
				<ProjectSettings project={project} />
			</TabPanel>
			<TabPanel>
				<MappingSettings project={project} />
			</TabPanel>
			<TabPanel>
				<BridgesSettings project={project} />
			</TabPanel>
		</Tabs>
	)
}
