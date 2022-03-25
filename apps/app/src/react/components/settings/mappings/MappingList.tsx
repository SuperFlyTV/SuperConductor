import { Box, Button, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import { literal } from '@shared/lib'
import React, { useCallback, useContext, useState } from 'react'
import {
	DeviceType,
	MappingAtem,
	MappingAtemType,
	MappingCasparCG,
	MappingOBS,
	MappingOBSType,
	Mappings,
	MappingVMix,
	MappingVMixType,
} from 'timeline-state-resolver-types'
import { describeMappingConfiguration, getDeviceName } from '../../../../lib/TSRMappings'
import { findDevice, listAvailableDeviceIDs } from '../../../../lib/util'
import { Project } from '../../../../models/project/Project'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler'
import { IPCServerContext } from '../../../contexts/IPCServer'
import { ProjectContext } from '../../../contexts/Project'
import { EditMapping } from './EditMapping'
import { NewMappingDialog } from './NewMappingDialog'

interface IMappingListProps {
	mappings: Mappings
	bridges: Project['bridges']
}

export const MappingList: React.FC<IMappingListProps> = ({ mappings, bridges }) => {
	const ipcServer = useContext(IPCServerContext)
	const project = useContext(ProjectContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const [editing, setEditing] = useState(false)
	const [addMappingOpen, setAddMappingOpen] = useState(false)

	const onNewMappingAccepted = useCallback(
		({ deviceId, mappingId }: { deviceId: string; mappingId: string }) => {
			const device = findDevice(bridges, deviceId)
			if (!device) {
				return
			}

			const layerName = mappingId
			let newMapping: MappingCasparCG | MappingAtem | MappingOBS | MappingVMix

			switch (device.type) {
				case DeviceType.CASPARCG: {
					newMapping = literal<MappingCasparCG>({
						device: DeviceType.CASPARCG,
						deviceId,
						layerName,
						channel: 1,
						layer: 10,
					})

					break
				}

				case DeviceType.ATEM: {
					newMapping = literal<MappingAtem>({
						device: DeviceType.ATEM,
						deviceId,
						layerName,
						mappingType: MappingAtemType.MixEffect,
					})

					break
				}

				case DeviceType.OBS: {
					newMapping = literal<MappingOBS>({
						device: DeviceType.OBS,
						deviceId,
						layerName,
						mappingType: MappingOBSType.CurrentScene,
					})

					break
				}

				case DeviceType.VMIX: {
					newMapping = literal<MappingVMix>({
						device: DeviceType.VMIX,
						deviceId,
						layerName,
						mappingType: MappingVMixType.Program,
					})

					break
				}

				// @TODO: Add more device types

				default:
					// Do nothing.
					// assertNever(deviceType)
					return
			}

			project.mappings[mappingId] = newMapping
			ipcServer.updateProject({ id: project.id, project }).catch(handleError)
			setAddMappingOpen(false)
		},
		[bridges, handleError, ipcServer, project]
	)

	return (
		<div className="mapping-list">
			{!editing && (
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>Mapping ID</TableCell>
							<TableCell>Mapping Name</TableCell>
							<TableCell>Mapping Type</TableCell>
							<TableCell>Device ID</TableCell>
							<TableCell>Configuration</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{Object.entries(mappings).map(([id, mapping]) => (
							<TableRow key={id}>
								<TableCell>{id}</TableCell>
								<TableCell>{mapping.layerName}</TableCell>
								<TableCell>{getDeviceName(mapping.device)}</TableCell>
								<TableCell>{mapping.deviceId}</TableCell>
								<TableCell>{describeMappingConfiguration(mapping)}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}

			{editing &&
				Object.entries(mappings).map(([id, mapping]) => {
					return <EditMapping key={id} mapping={mapping} mappingId={id} />
				})}

			{editing && (
				<Box marginTop="1rem">
					<Button
						variant="contained"
						onClick={() => {
							setAddMappingOpen(true)
						}}
					>
						Add Mapping
					</Button>
				</Box>
			)}

			<Button
				variant="contained"
				sx={{ width: '165px', marginTop: '2rem' }}
				onClick={() => {
					setEditing((editing) => !editing)
				}}
			>
				{editing ? 'Finish editing' : 'Edit mappings'}
			</Button>

			<NewMappingDialog
				mappings={mappings}
				open={addMappingOpen}
				deviceIds={listAvailableDeviceIDs(bridges)}
				onAccepted={onNewMappingAccepted}
				onDiscarded={() => {
					setAddMappingOpen(false)
				}}
			/>
		</div>
	)
}
