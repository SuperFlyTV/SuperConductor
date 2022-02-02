import { Box, Tab, Tabs } from '@mui/material'
import React from 'react'
import { Project } from '../../../models/project/Project'
import { BridgesSettings } from './BridgesSettings'
import { MappingSettings } from './MappingSettings'
import { ProjectSettings } from './ProjectSettings'

interface TabPanelProps {
	children?: React.ReactNode
	index: number
	value: number
}

function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props

	return (
		<div
			role="tabpanel"
			hidden={value !== index}
			id={`simple-tabpanel-${index}`}
			aria-labelledby={`simple-tab-${index}`}
			{...other}
		>
			{value === index && <Box sx={{ p: 3 }}>{children}</Box>}
		</div>
	)
}

function a11yProps(index: number) {
	return {
		id: `simple-tab-${index}`,
		'aria-controls': `simple-tabpanel-${index}`,
	}
}

export const Settings: React.FC<{ project: Project }> = ({ project }) => {
	const [value, setValue] = React.useState(0)

	const handleChange = (event: React.SyntheticEvent, newValue: number) => {
		setValue(newValue)
	}

	return (
		<>
			<Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
				<Tabs value={value} onChange={handleChange} aria-label="settings tabs">
					<Tab label="Project Settings" {...a11yProps(0)} />
					<Tab label="Mappings" {...a11yProps(1)} />
					<Tab label="Bridges" {...a11yProps(2)} />
				</Tabs>
			</Box>
			<TabPanel value={value} index={0}>
				<ProjectSettings project={project} />
			</TabPanel>
			<TabPanel value={value} index={1}>
				<MappingSettings project={project} />
			</TabPanel>
			<TabPanel value={value} index={2}>
				<BridgesSettings project={project} />
			</TabPanel>
		</>
	)
}
