import React from 'react'
import { Project } from '../../../../models/project/Project.js'
import { observer } from 'mobx-react-lite'
import { store } from '../../../mobx/store.js'
import { ProjectPage } from './projectPage/ProjectPage.js'
import { ProjectPageMenubar } from './projectPageMenubar/ProjectPageMenubar.js'
import { HomePageId } from 'src/react/mobx/GuiStore.js'
import { BridgesPage } from './bridgesPage/BridgesPage.js'
import { LayersPage } from './layersPage/LayersPage.js'
import { ApplicationActionsPage } from './ApplicationActionsPage/ApplicationActionsPage.js'
import { AnalogInputsPage } from './AnalogInputsPage/AnalogInputsPage.js'
import { ErrorBoundary } from '../../util/ErrorBoundary.js'
import { ApplicationPage } from './applicationPage/ApplicationPage.js'

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
				<>{activeHomePageId === 'applicationActions' && <ApplicationActionsPage />}</>
				<>{activeHomePageId === 'analogInputs' && <AnalogInputsPage />}</>
				<>{activeHomePageId === 'project' && <ProjectPage project={props.project} />}</>
				<>{activeHomePageId === 'applicationSettings' && <ApplicationPage />}</>
				<>{activeHomePageId === 'bridgesSettings' && <BridgesPage project={props.project} />}</>
				<>{activeHomePageId === 'mappingsSettings' && <LayersPage project={props.project} />}</>
			</ErrorBoundary>
		</div>
	)
})
