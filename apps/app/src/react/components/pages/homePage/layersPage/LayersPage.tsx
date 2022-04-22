import React, { useState } from 'react'
import { Project } from '../../../../../models/project/Project'
import { observer } from 'mobx-react-lite'
import { RoundedSection } from '../roundedSection/RoundedSection'
import { TextBtn } from '../../../inputs/textBtn/TextBtn'
import { ScList } from '../scList/ScList'
import { LayerItemContent } from '../layerItem/LayerItemContent'
import { LayerItemHeader } from '../layerItem/LayerItemHeader'
import { NewLayerDialog } from './NewLayerDialog'
import { ProjectPageLayout } from '../projectPageLayout/ProjectPageLayout'
import { findDevice, listAvailableDeviceIDs } from '../../../../../lib/util'
import 'react-toggle/style.css'

export const LayersPage: React.FC<{ project: Project }> = observer(function LayersPage({ project }) {
	const [newLayerDeviceId, setNewLayerDeviceId] = useState<string>()

	const help = (
		<>
			Layers contain the settings for <i>where</i> things are to be played out.
			<br />
			Make sure you&apos;ve added the device you want to control on the Bridges page. Then add a layer, pick that
			device and set the settings.
		</>
	)

	const handleCloseDialog = () => {
		setNewLayerDeviceId(undefined)
	}

	return (
		<ProjectPageLayout title="Layers" help={help}>
			{/* <MappingList mappings={project.mappings} bridges={project.bridges} /> */}

			{listAvailableDeviceIDs(project.bridges).map((deviceId) => {
				const device = findDevice(project.bridges, deviceId)

				if (!device) {
					console.error(`Device ${deviceId} not found.`)
					return null
				}

				return (
					<RoundedSection
						key={deviceId}
						title={`${deviceId} layers`}
						controls={<TextBtn label="Add" onClick={() => setNewLayerDeviceId(deviceId)} />}
					>
						<NewLayerDialog
							deviceId={deviceId}
							device={device}
							open={newLayerDeviceId === deviceId}
							bridges={project.bridges}
							onClose={handleCloseDialog}
						/>
						<ScList
							list={Object.entries(project.mappings)
								.filter(([_mappingId, mapping]) => {
									return mapping.deviceId === deviceId
								})
								.map(([mappingId, mapping]) => {
									return {
										id: mappingId,
										header: <LayerItemHeader id={mappingId} mapping={mapping} />,
										content: <LayerItemContent mappingId={mappingId} mapping={mapping} />,
									}
								})}
						/>
					</RoundedSection>
				)
			})}
		</ProjectPageLayout>
	)
})
