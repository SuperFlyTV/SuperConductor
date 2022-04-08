/* eslint-disable @typescript-eslint/no-unused-vars */
import { observer } from 'mobx-react-lite'
import React from 'react'

import { ProjectPageLayout } from './projectPageLayout/ProjectPageLayout'
import { Project } from 'src/models/project/Project'
import { MappingSettings } from '../../settings/mappings/MappingSettings'

export const MappingsPage: React.FC<{ project: Project }> = observer(function MappingsPage(props) {
	const help = (
		<>
			Layers contain the settings for <i>where</i> things are to be played out.
			<br />
			Make sure you&apos;ve added the device you want to control on the Bridges page. Then add a layer, pick that
			device and set the settings.
		</>
	)

	return (
		<ProjectPageLayout title="Layers" help={help}>
			<MappingSettings project={props.project} />
		</ProjectPageLayout>
	)
})
