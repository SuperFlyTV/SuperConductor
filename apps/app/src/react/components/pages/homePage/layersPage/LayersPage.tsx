/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useContext, useMemo, useState } from 'react'
import { INTERNAL_BRIDGE_ID } from '../../../../../models/project/Bridge'
import { Project } from '../../../../../models/project/Project'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler'
import { IPCServerContext } from '../../../../contexts/IPCServer'
import { store } from '../../../../mobx/store'
import { observer } from 'mobx-react-lite'
import { RoundedSection } from '../roundedSection/RoundedSection'
import { TextBtn } from '../../../inputs/textBtn/TextBtn'
import { ScList } from '../scList/ScList'
import { BridgeItemHeader } from '../bridgeItem/BridgeItemHeader'
import { BridgeItemContent } from '../bridgeItem/BridgeItemContent'
import { ProjectPageLayout } from '../projectPageLayout/ProjectPageLayout'
import { NewBridgeDialog } from '../bridgesPage/NewBridgeDialog'

import 'react-toggle/style.css'
import { MappingList } from '../../../settings/mappings/MappingList'
import { LayerItemContent } from '../layerItem/LayerItemContent'
import { LayerItemHeader } from '../layerItem/LayerItemHeader'
import { PinDropSharp } from '@mui/icons-material'
import { findDevice, listAvailableDeviceIDs } from '../../../../../lib/util'
import { NewLayerDialog } from './NewLayerDialog'

export const LayersPage: React.FC<{ project: Project }> = observer(function LayersPage({ project }) {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
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
								.filter(([mappingId, mapping]) => {
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
