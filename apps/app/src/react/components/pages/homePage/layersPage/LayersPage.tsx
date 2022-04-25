import React, { useContext, useState } from 'react'
import { Project } from '../../../../../models/project/Project'
import { observer } from 'mobx-react-lite'
import { RoundedSection } from '../roundedSection/RoundedSection'
import { TextBtn } from '../../../inputs/textBtn/TextBtn'
import { ScList } from '../scList/ScList'
import { LayerItemContent } from '../layerItem/LayerItemContent'
import { LayerItemHeader } from '../layerItem/LayerItemHeader'
import { ProjectPageLayout } from '../projectPageLayout/ProjectPageLayout'
import { findDevice, listAvailableDeviceIDs, shortID } from '../../../../../lib/util'
import 'react-toggle/style.css'
import { getDefaultMappingForDeviceType } from '../../../../../lib/TSRMappings'
import { IPCServerContext } from '../../../../contexts/IPCServer'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler'

export const LayersPage: React.FC<{ project: Project }> = observer(function LayersPage({ project }) {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const [newlyCreatedId, setNewlyCreatedId] = useState<string | undefined>()

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
			{listAvailableDeviceIDs(project.bridges).map((deviceId) => {
				const device = findDevice(project.bridges, deviceId)

				if (!device) {
					console.error(`Device ${deviceId} not found.`)
					return null
				}

				return (
					<RoundedSection key={deviceId} title={`${deviceId} layers`}>
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
										openByDefault: mappingId === newlyCreatedId,
									}
								})}
							openByDefault={newlyCreatedId ? [newlyCreatedId] : undefined}
						/>
						<div className="bottom-controls">
							<TextBtn
								label="Add new layer"
								onClick={() => {
									const defaultMapping = getDefaultMappingForDeviceType(
										device.type,
										deviceId,
										project.mappings
									)

									const mappingId = shortID()
									project.mappings[mappingId] = defaultMapping

									setNewlyCreatedId(mappingId)

									ipcServer.updateProject({ id: project.id, project }).catch(handleError)
								}}
							/>
						</div>
					</RoundedSection>
				)
			})}
			<div className="note">To add more devices, go to Bridges settings page.</div>
		</ProjectPageLayout>
	)
})
