import React, { useContext, useState } from 'react'
import { Project } from '../../../../../models/project/Project'
import { observer } from 'mobx-react-lite'
import { RoundedSection } from '../roundedSection/RoundedSection'
import { TextBtn } from '../../../inputs/textBtn/TextBtn'
import { ScList } from '../scList/ScList'
import { LayerItemContent } from '../layerItem/LayerItemContent'
import { LayerItemHeader } from '../layerItem/LayerItemHeader'
import { ProjectPageLayout } from '../projectPageLayout/ProjectPageLayout'
import { findDevice, getDeviceName, listAvailableDeviceIDs, shortID } from '../../../../../lib/util'
import 'react-toggle/style.css'
import { getDefaultMappingForDeviceType, sortMappings } from '../../../../../lib/TSRMappings'
import { IPCServerContext } from '../../../../contexts/IPCServer'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler'
import { LoggerContext } from '../../../../contexts/Logger'
import { DeviceIcon } from '../deviceIcon/DeviceIcon'

export const LayersPage: React.FC<{ project: Project }> = observer(function LayersPage({ project }) {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const log = useContext(LoggerContext)

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
			{Array.from(listAvailableDeviceIDs(project.bridges)).map((deviceId) => {
				const device = findDevice(project.bridges, deviceId)
				const deviceName = getDeviceName(project, deviceId)

				if (!device) {
					log.error(`Device ${deviceId} not found.`)
					return null
				}

				const nameToShow = deviceName ? deviceName : 'Untitled device'

				return (
					<RoundedSection
						key={deviceId}
						title={
							<>
								<DeviceIcon type={device.type} />
								{`${nameToShow} layers`}
							</>
						}
					>
						<ScList
							list={sortMappings(project.mappings)
								.filter(({ mapping }) => {
									return mapping.deviceId === deviceId
								})
								.map(({ layerId, mapping }) => {
									return {
										id: layerId,
										header: <LayerItemHeader id={layerId} mapping={mapping} deviceId={deviceId} />,
										content: <LayerItemContent mappingId={layerId} mapping={mapping} />,
										openByDefault: layerId === newlyCreatedId,
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
