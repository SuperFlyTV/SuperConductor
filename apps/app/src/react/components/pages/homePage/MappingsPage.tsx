/* eslint-disable @typescript-eslint/no-unused-vars */
import { observer } from 'mobx-react-lite'
import React, { useContext } from 'react'
import { TrashBtn } from '../../inputs/TrashBtn'
import { store } from '../../../mobx/store'
import { Button } from '@mui/material'
import { IPCServerContext } from '../../../contexts/IPCServer'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler'

import { ProjectPageLayout } from './projectPageLayout/ProjectPageLayout'
import { Project } from 'src/models/project/Project'
import { MappingSettings } from '../../settings/mappings/MappingSettings'

export const MappingsPage: React.FC<{ project: Project }> = observer(function MappingsPage(props) {
	const serverAPI = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const rundownsStore = store.rundownsStore
	const guiStore = store.guiStore

	const handleReopen = (rundownId: string) => {
		serverAPI.openRundown({ rundownId }).catch(handleError)
		// guiStore.currentlyActiveTabSection = 'rundown'
	}

	return (
		<ProjectPageLayout title="Mappings">
			<MappingSettings project={props.project} />
		</ProjectPageLayout>
	)
})
