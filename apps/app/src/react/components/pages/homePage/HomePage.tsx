/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react'
import { Project } from 'src/models/project/Project'
import { observer } from 'mobx-react-lite'
import { store } from '../../../mobx/store'
import { ProjectPage } from './ProjectPage'
import { AiFillFolderOpen, AiOutlinePlusCircle } from 'react-icons/ai'
import { ProjectPageMenubar } from './projectPageMenubar/ProjectPageMenubar'
import { BridgesPage } from './BridgesPage'
import { MappingsPage } from './MappingsPage'

export const HomePage: React.FC<{ project: Project }> = observer((props) => {
	const apId = store.guiStore.activeProjectPageId

	return (
		<div className="project-page-layout">
			<ProjectPageMenubar
				activeItemId={apId}
				onItemClick={(itemId) => {
					if (itemId === 'newProject') {
						alert('TODO: New Project')
					} else if (itemId === 'openProject') {
						alert('TODO: Open Project')
					} else {
						store.guiStore.activeProjectPageId = itemId
					}
				}}
				menubar={[
					{
						groupId: 'general',
						items: [
							{ id: 'newProject', label: 'New Project', icon: <AiOutlinePlusCircle /> },
							{ id: 'openProject', label: 'Open Project', icon: <AiFillFolderOpen /> },
						],
					},
					{
						groupId: 'project',
						items: [
							{ id: 'project', label: 'Project' },
							{
								id: 'bridgeSettings',
								label: 'Brigdes',
							},
							{
								id: 'mappingsSettings',
								label: 'Mappings',
							},
						],
					},
				]}
			/>
			{apId === 'project' && <ProjectPage />}
			{apId === 'bridgeSettings' && <BridgesPage project={props.project} />}
			{apId === 'mappingsSettings' && <MappingsPage project={props.project} />}
		</div>
	)
})
