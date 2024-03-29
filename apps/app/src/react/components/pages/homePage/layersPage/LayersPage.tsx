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
import { getDefaultMappingForDeviceType, SortedMappings, sortMappings } from '../../../../../lib/TSRMappings'
import { IPCServerContext } from '../../../../contexts/IPCServer'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler'
import { DeviceIcon } from '../deviceIcon/DeviceIcon'
import { DeviceOptionsAny } from 'timeline-state-resolver-types'

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

	const devicesWithMappings: Map<
		string,
		{
			device: DeviceOptionsAny | undefined
			mappings: SortedMappings
		}
	> = new Map()

	for (const deviceId of listAvailableDeviceIDs(project.bridges)) {
		devicesWithMappings.set(deviceId, {
			device: findDevice(project.bridges, deviceId),
			mappings: [],
		})
	}
	for (const m of sortMappings(project.mappings)) {
		let d = devicesWithMappings.get(m.mapping.deviceId)
		if (!d) {
			d = {
				device: undefined,
				mappings: [],
			}
			devicesWithMappings.set(m.mapping.deviceId, d)
		}
		d.mappings.push(m)
	}

	return (
		<ProjectPageLayout title="Layers" help={help}>
			{Array.from(devicesWithMappings.entries()).map(([deviceId, d]) => {
				const device = d.device
				const mappings = d.mappings

				const deviceName = getDeviceName(project, deviceId)

				const nameToShow = deviceName ? deviceName : 'Untitled device'

				return (
					<RoundedSection
						key={deviceId}
						title={
							<>
								<DeviceIcon type={device?.type} />
								{`${nameToShow} layers`}
							</>
						}
					>
						<ScList
							list={mappings
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
							{device && (
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
							)}
						</div>
					</RoundedSection>
				)
			})}
			<div className="note">To add more devices, go to Bridges settings page.</div>
		</ProjectPageLayout>
	)
})
