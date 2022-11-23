/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react'
import { Project } from 'src/models/project/Project'
import { observer } from 'mobx-react-lite'
import { store } from '../../../mobx/store'
import { ProjectPage } from './projectPage/ProjectPage'
import { ProjectPageMenubar } from './projectPageMenubar/ProjectPageMenubar'
import { HomePageId } from 'src/react/mobx/GuiStore'
import { BridgesPage } from './bridgesPage/BridgesPage'
import { LayersPage } from './layersPage/LayersPage'
import { ApplicationActionsPage } from './ApplicationActionsPage/ApplicationActionsPage'
import { AnalogInputsPage } from './AnalogInputsPage/AnalogInputsPage'
import { ErrorBoundary } from '../../util/ErrorBoundary'
import { ApplicationPage } from './applicationPage/ApplicationPage'

export const HomePage: React.FC<{ project: Project }> = observer(function HomePage(props) {
	const activeHomePageId = store.guiStore.activeHomePageId

	return (
		<div className="project-page-layout">
			<ProjectPageMenubar
				activeItemId={activeHomePageId}
				onItemClick={(itemId) => {
					if (itemId === 'newProject') {
						alert('This feature is not implemented yet.')
					} else if (itemId === 'openProject') {
						alert('This feature is not implemented yet.')
					} else {
						store.guiStore.goToHome(itemId as HomePageId)
					}
				}}
				menubar={[
					{
						groupId: 'project',
						items: [{ id: 'project', label: 'Project' }],
					},
					{
						groupId: 'application',
						items: [
							{ id: 'applicationSettings', label: 'Application settings' },
							{ id: 'applicationActions', label: 'Application triggers' },
							{ id: 'analogInputs', label: 'Analog inputs' },
						],
					},
					{
						groupId: 'general',
						items: [
							{
								id: 'bridgesSettings',
								label: 'Bridges',
							},
							{
								id: 'mappingsSettings',
								label: 'Layers',
							},
						],
					},
				]}
			/>
			<ErrorBoundary>
				{activeHomePageId === 'applicationActions' && <ApplicationActionsPage />}
				{activeHomePageId === 'analogInputs' && <AnalogInputsPage />}
				{activeHomePageId === 'project' && <ProjectPage project={props.project} />}
				{activeHomePageId === 'applicationSettings' && <ApplicationPage />}
				{activeHomePageId === 'bridgesSettings' && <BridgesPage project={props.project} />}
				{activeHomePageId === 'mappingsSettings' && <LayersPage project={props.project} />}
			</ErrorBoundary>
		</div>
	)
})
