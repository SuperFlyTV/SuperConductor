import React from 'react'
import { ProjectPageLayout } from './ProjectPageLayout'

import './projectPage.scss'
import { ProjectSettings } from '../../settings/ProjectSettings'
import { Project } from 'src/models/project/Project'
import { BridgesSettings } from '../../settings/BridgesSettings'
import { MappingSettings } from '../../settings/mappings/MappingSettings'
import { observer } from 'mobx-react-lite'
import { store } from '../../../mobx/store'
import { RundownsPage } from './rundownsPage/RundownsPage'

export const ProjectPage: React.FC<{ project: Project }> = observer((props) => {
	return (
		<ProjectPageLayout
			activePageId={store.guiStore.activeProjectPageId}
			onPageClick={(pageId) => (store.guiStore.activeProjectPageId = pageId)}
			pages={[
				{ id: 'project', label: 'Project', content: <ProjectSettings project={props.project} /> },
				{ id: 'rundowns', label: 'Rundowns', content: <RundownsPage /> },
				{ id: 'bridgeSettings', label: 'Brigdes', content: <BridgesSettings project={props.project} /> },
				{ id: 'mappingSettings', label: 'Mappings', content: <MappingSettings project={props.project} /> },
			]}
		/>
	)
})
