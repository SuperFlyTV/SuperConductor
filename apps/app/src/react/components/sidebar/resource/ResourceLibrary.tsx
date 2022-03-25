import React, { useCallback, useContext, useMemo, useState } from 'react'
import { SidebarInfoGroup } from '../SidebarInfoGroup'
import { IPCServerContext } from '../../../contexts/IPCServer'
import { RundownContext } from '../../../contexts/Rundown'
import { ProjectContext } from '../../../contexts/Project'
import { ResourceAny, ResourceType } from '@shared/models'
import { assertNever, bytesToSize } from '@shared/lib'
import { ResourceData } from './ResourceData'
import { ResourceLibraryItem } from './ResourceLibraryItem'
import { Part } from '../../../../models/rundown/Part'
import { Field, Form, Formik } from 'formik'
import { findPartInRundown } from '../../../../lib/util'
import { Rundown } from '../../../../models/rundown/Rundown'
import { Group } from '../../../../models/rundown/Group'
import { ResourceLibraryItemThumbnail } from './ResourceLibraryItemThumbnail'
import {
	Button,
	Divider,
	FormControl,
	Grid,
	InputLabel,
	ListItemText,
	MenuItem,
	OutlinedInput,
	TextField,
	Typography,
	Checkbox,
	Select,
	SelectChangeEvent,
	Stack,
} from '@mui/material'
import { TextField as FormikMuiTextField } from 'formik-mui'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler'
import { formatDurationLabeled } from '../../../../lib/timeLib'
import { store } from '../../../mobx/store'
import { observer } from 'mobx-react-lite'
import { HiRefresh } from 'react-icons/hi'

const ITEM_HEIGHT = 48
const ITEM_PADDING_TOP = 8
const MenuProps = {
	PaperProps: {
		style: {
			maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
			width: 250,
		},
	},
}

export const ResourceLibrary: React.FC = observer(() => {
	const ipcServer = useContext(IPCServerContext)
	const rundown = useContext(RundownContext)
	const project = useContext(ProjectContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const resourcesStore = store.resourcesStore

	const defaultPart = rundown.groups[0]?.parts[0] as Part | undefined
	const defaultLayer = Object.keys(project.mappings)[0] as string | undefined

	const [selectedResourceId, setSelectedResourceId] = useState<string | undefined>()
	const selectedResource = selectedResourceId ? resourcesStore.resources[selectedResourceId] : undefined

	const [nameFilterValue, setNameFilterValue] = React.useState('')
	const [deviceFilterValue, setDeviceFilterValue] = React.useState<string[]>([])

	const resourcesFilteredByDevice = useMemo(() => {
		if (deviceFilterValue.length <= 0) {
			return Object.values(resourcesStore.resources)
		}

		return Object.values(resourcesStore.resources).filter((resource) => {
			return deviceFilterValue.includes(resource.deviceId)
		})
	}, [deviceFilterValue, resourcesStore.resources])

	const resourcesFilteredByDeviceAndName = useMemo(() => {
		if (nameFilterValue.trim().length === 0) {
			return resourcesFilteredByDevice
		}

		return resourcesFilteredByDevice.filter((resource) => {
			const name = resource.displayName
			return name.toLowerCase().includes(nameFilterValue.toLowerCase())
		})
	}, [nameFilterValue, resourcesFilteredByDevice])

	const filteredResourcesByDeviceId = useMemo(() => {
		const ret: { [key: string]: ResourceAny[] } = {}

		for (const resource of resourcesFilteredByDeviceAndName) {
			if (!(resource.deviceId in ret)) {
				ret[resource.deviceId] = []
			}
			ret[resource.deviceId].push(resource)
		}

		return ret
	}, [resourcesFilteredByDeviceAndName])

	const deviceIds = useMemo(() => {
		const deviceIds = new Set<string>()
		for (const bridgeId in project.bridges) {
			const bridge = project.bridges[bridgeId]
			for (const deviceId in bridge.settings.devices) {
				deviceIds.add(deviceId)
			}
		}
		return Array.from(deviceIds)
	}, [project.bridges])

	const handleDeviceFilterChange = useCallback((event: SelectChangeEvent<typeof deviceFilterValue>) => {
		const {
			target: { value },
		} = event
		setDeviceFilterValue(
			// On autofill we get a stringified value.
			typeof value === 'string' ? value.split(',') : value
		)
	}, [])

	return (
		<div className="sidebar media-library-sidebar">
			<SidebarInfoGroup
				title="Available Resources"
				enableRefresh={true}
				refreshActive={resourcesStore.isAnyDeviceRefreshing()}
				onRefreshClick={async () => {
					try {
						await ipcServer.refreshResources()
					} catch (err) {
						handleError(err)
					}
				}}
			>
				<FormControl margin="dense" size="small" fullWidth>
					<InputLabel id="resource-library-deviceid-filter-label">Filter Resources by Device</InputLabel>
					<Select
						labelId="resource-library-deviceid-filter-label"
						id="resource-library-deviceid-filter"
						multiple
						value={deviceFilterValue}
						onChange={handleDeviceFilterChange}
						input={<OutlinedInput label="Filter Resources by Device" />}
						renderValue={(selected) => selected.join(', ')}
						MenuProps={MenuProps}
					>
						{deviceIds.map((deviceId) => (
							<MenuItem key={deviceId} value={deviceId}>
								<Checkbox checked={deviceFilterValue.indexOf(deviceId) > -1} />
								<ListItemText primary={deviceId} />
							</MenuItem>
						))}
					</Select>
				</FormControl>

				<TextField
					size="small"
					margin="normal"
					fullWidth
					label="Filter Resources by Name"
					value={nameFilterValue}
					InputProps={{
						type: 'search',
					}}
					onChange={(event) => {
						setNameFilterValue(event.target.value)
					}}
				/>

				{Object.entries(filteredResourcesByDeviceId).map(([deviceId, resources]) => {
					return (
						<React.Fragment key={deviceId}>
							<Stack direction="row" justifyContent="space-between">
								<Typography variant="body2">{deviceId}</Typography>
								{resourcesStore.refreshStatuses[deviceId] && (
									<div className="refresh active" style={{ opacity: '0.6' }}>
										<HiRefresh size={15} color="white" />
									</div>
								)}
							</Stack>
							<Divider />
							{resources
								.map<[ResourceAny, JSX.Element]>((resource) => {
									if (resource.resourceType === ResourceType.CASPARCG_MEDIA) {
										return [
											resource,
											<>
												<ResourceLibraryItemThumbnail resource={resource} />
												<div className="resource__details">
													<div className="resource__name" title={resource.displayName}>
														{resource.displayName}
													</div>
													<div className="resource__attributes">
														<div>{resource.type}</div>
														<div style={{ textAlign: 'right' }}>
															{bytesToSize(resource.size)}
														</div>
														<div style={{ textAlign: 'right' }}>
															{formatDurationLabeled(resource.duration * 1000)}
														</div>
													</div>
												</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.CASPARCG_TEMPLATE) {
										return [
											resource,
											<>
												<div className="resource__name">{resource.displayName}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.CASPARCG_SERVER) {
										return [resource, <></>]
									} else if (resource.resourceType === ResourceType.ATEM_ME) {
										return [
											resource,
											<>
												<div className="resource__name">{resource.displayName}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.ATEM_DSK) {
										return [
											resource,
											<>
												<div className="resource__name">{resource.displayName}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.ATEM_AUX) {
										return [
											resource,
											<>
												<div className="resource__name">{resource.displayName}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.ATEM_SSRC) {
										return [
											resource,
											<>
												<div className="resource__name">{resource.displayName}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.ATEM_SSRC_PROPS) {
										return [
											resource,
											<>
												<div className="resource__name">{resource.displayName}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.ATEM_MACRO_PLAYER) {
										return [
											resource,
											<>
												<div className="resource__name">{resource.displayName}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.ATEM_AUDIO_CHANNEL) {
										return [
											resource,
											<>
												<div className="resource__name">{resource.displayName}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.ATEM_MEDIA_PLAYER) {
										return [
											resource,
											<>
												<div className="resource__name">{resource.displayName}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.OBS_SCENE) {
										return [
											resource,
											<>
												<div className="resource__name">{resource.displayName}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.OBS_TRANSITION) {
										return [
											resource,
											<>
												<div className="resource__name">{resource.displayName}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.OBS_RECORDING) {
										return [
											resource,
											<>
												<div className="resource__name">{resource.displayName}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.OBS_STREAMING) {
										return [
											resource,
											<>
												<div className="resource__name">{resource.displayName}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.OBS_SOURCE_SETTINGS) {
										return [
											resource,
											<>
												<div className="resource__name">{resource.displayName}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.OBS_MUTE) {
										return [
											resource,
											<>
												<div className="resource__name">{resource.displayName}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.OBS_RENDER) {
										return [
											resource,
											<>
												<div className="resource__name">{resource.displayName}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.VMIX_INPUT) {
										return [
											resource,
											<>
												<div className="resource__details">
													<div className="resource__name" title={resource.displayName}>
														{resource.displayName}
													</div>
													<div className="resource__attributes">
														<div>{resource.type}</div>
													</div>
												</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.VMIX_INPUT_SETTINGS) {
										return [
											resource,
											<>
												<div className="resource__name">{resource.displayName}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.VMIX_AUDIO_SETTINGS) {
										return [
											resource,
											<>
												<div className="resource__name">{resource.displayName}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.VMIX_OUTPUT_SETTINGS) {
										return [
											resource,
											<>
												<div className="resource__name">{resource.displayName}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.VMIX_OVERLAY_SETTINGS) {
										return [
											resource,
											<>
												<div className="resource__name">{resource.displayName}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.VMIX_RECORDING) {
										return [
											resource,
											<>
												<div className="resource__name">{resource.displayName}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.VMIX_STREAMING) {
										return [
											resource,
											<>
												<div className="resource__name">{resource.displayName}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.VMIX_EXTERNAL) {
										return [
											resource,
											<>
												<div className="resource__name">{resource.displayName}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.VMIX_FADE_TO_BLACK) {
										return [
											resource,
											<>
												<div className="resource__name">{resource.displayName}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.VMIX_FADER) {
										return [
											resource,
											<>
												<div className="resource__name">{resource.displayName}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.VMIX_PREVIEW) {
										return [
											resource,
											<>
												<div className="resource__name">{resource.displayName}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.OSC_MESSAGE) {
										return [
											resource,
											<>
												<div className="resource__name">{resource.displayName}</div>
											</>,
										]
									} else {
										assertNever(resource)
										return [resource, <></>]
									}
								})
								.map((d: [ResourceAny, JSX.Element]) => {
									const resource: ResourceAny = d[0]
									const child: JSX.Element = d[1]

									return (
										<React.Fragment key={resource.id}>
											<ResourceLibraryItem
												resource={resource}
												selected={resource.id === selectedResourceId}
												onClick={() => {
													if (selectedResourceId === resource.id) {
														setSelectedResourceId(undefined)
													} else {
														setSelectedResourceId(resource.id)
													}
												}}
											>
												{child}
											</ResourceLibraryItem>
										</React.Fragment>
									)
								})}
						</React.Fragment>
					)
				})}
			</SidebarInfoGroup>

			{selectedResource && (
				<>
					<ResourceData resource={selectedResource} />
					{defaultPart && defaultLayer && (
						<div className="add-to-timeline">
							<Formik
								initialValues={{ partId: defaultPart.id, layerId: defaultLayer }}
								onSubmit={(values, actions) => {
									if (!values.partId || !values.layerId) {
										actions.setSubmitting(false)
										return
									}

									const part = findPartInRundown(rundown, values.partId)
									if (!part) {
										actions.setSubmitting(false)
										return
									}

									ipcServer
										.addResourceToTimeline({
											rundownId: rundown.id,
											groupId: part.group.id,
											partId: part.part.id,
											layerId: values.layerId,
											resourceId: selectedResource.id,
										})
										.catch(handleError)
									actions.setSubmitting(false)
								}}
							>
								{() => (
									<Form>
										<div className="label">Add to timeline</div>
										<div className="dropdowns">
											<Grid container spacing={2}>
												<Grid item xs={6}>
													<Field
														component={FormikMuiTextField}
														select
														size="small"
														margin="normal"
														fullWidth
														name="partId"
														label="Part"
													>
														{getAllPartsInRundown(rundown).map((p) => {
															return (
																<MenuItem key={p.part.id} value={p.part.id}>
																	{p.group.transparent
																		? p.part.name
																		: `${p.group.name}: ${p.part.name}`}
																</MenuItem>
															)
														})}
													</Field>
												</Grid>

												<Grid item xs={6}>
													<Field
														component={FormikMuiTextField}
														select
														size="small"
														margin="normal"
														fullWidth
														name="layerId"
														label="Layer"
													>
														{Object.entries(project.mappings).map(([layerId, mapping]) => (
															<MenuItem key={layerId} value={layerId}>
																{mapping.layerName || layerId}
															</MenuItem>
														))}
													</Field>
												</Grid>
											</Grid>
										</div>
										<div className="btn-row-right">
											<Button variant="contained" type="submit">
												Add
											</Button>
										</div>
									</Form>
								)}
							</Formik>
						</div>
					)}
				</>
			)}
		</div>
	)
})

function getAllPartsInRundown(rundown: Rundown): { part: Part; group: Group }[] {
	const parts: { part: Part; group: Group }[] = []
	for (const group of rundown.groups) {
		for (const part of group.parts) {
			parts.push({ part, group })
		}
	}
	return parts
}
