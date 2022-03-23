import React, { useContext, useMemo, useState } from 'react'
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
import { Button, Divider, Grid, MenuItem, TextField, Typography } from '@mui/material'
import { TextField as FormikMuiTextField } from 'formik-mui'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler'
import { formatDurationLabeled } from '../../../../lib/timeLib'
import { store } from '../../../mobx/store'
import { observer } from 'mobx-react-lite'

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

	const [refreshing, setRefreshing] = useState(false)

	const [filterValue, setFilterValue] = React.useState('')

	const filteredResources = useMemo(() => {
		if (filterValue.trim().length === 0) {
			return Object.values(resourcesStore.resources)
		}

		return Object.values(resourcesStore.resources).filter((resource) => {
			if ('name' in resource) {
				const name: string = (resource as any).name
				return name.toLowerCase().includes(filterValue.toLowerCase())
			}

			return false
		})
	}, [resourcesStore.resources, filterValue])

	const resourcesByDeviceId = useMemo(() => {
		const ret: { [key: string]: ResourceAny[] } = {}

		for (const resource of filteredResources) {
			if (!(resource.deviceId in ret)) {
				ret[resource.deviceId] = []
			}
			ret[resource.deviceId].push(resource)
		}

		return ret
	}, [filteredResources])

	return (
		<div className="sidebar media-library-sidebar">
			<SidebarInfoGroup
				title="Available Resources"
				enableRefresh={true}
				refreshActive={refreshing}
				onRefreshClick={async () => {
					setRefreshing(true)
					try {
						await ipcServer.refreshResources()
					} catch (err) {
						handleError(err)
					}
					setRefreshing(false)
				}}
			>
				<TextField
					size="small"
					margin="normal"
					fullWidth
					label="Filter Resources"
					value={filterValue}
					InputProps={{
						type: 'search',
					}}
					onChange={(event) => {
						setFilterValue(event.target.value)
					}}
				/>

				{Object.entries(resourcesByDeviceId).map(([deviceId, resources]) => {
					return (
						<React.Fragment key={deviceId}>
							<Typography variant="body2">{deviceId}</Typography>
							<Divider />
							{resources
								.map<[ResourceAny, JSX.Element]>((resource) => {
									if (resource.resourceType === ResourceType.CASPARCG_MEDIA) {
										return [
											resource,
											<>
												<ResourceLibraryItemThumbnail resource={resource} />
												<div className="resource__details">
													<div className="resource__name" title={resource.name}>
														{resource.name}
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
												<div className="resource__name">{resource.name}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.CASPARCG_SERVER) {
										return [resource, <></>]
									} else if (resource.resourceType === ResourceType.ATEM_ME) {
										return [
											resource,
											<>
												<div className="resource__name">{resource.name}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.ATEM_DSK) {
										return [
											resource,
											<>
												<div className="resource__name">{resource.name}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.ATEM_AUX) {
										return [
											resource,
											<>
												<div className="resource__name">{resource.name}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.ATEM_SSRC) {
										return [
											resource,
											<>
												<div className="resource__name">{resource.name}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.ATEM_SSRC_PROPS) {
										return [
											resource,
											<>
												<div className="resource__name">{resource.name}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.ATEM_MACRO_PLAYER) {
										return [
											resource,
											<>
												<div className="resource__name">{resource.name}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.ATEM_AUDIO_CHANNEL) {
										return [
											resource,
											<>
												<div className="resource__name">{resource.name}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.ATEM_MEDIA_PLAYER) {
										return [
											resource,
											<>
												<div className="resource__name">{resource.name}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.OBS_SCENE) {
										return [
											resource,
											<>
												<div className="resource__name">Scene: {resource.name}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.OBS_TRANSITION) {
										return [
											resource,
											<>
												<div className="resource__name">Transition: {resource.name}</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.OBS_RECORDING) {
										return [
											resource,
											<>
												<div className="resource__name">Recording</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.OBS_STREAMING) {
										return [
											resource,
											<>
												<div className="resource__name">Streaming</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.OBS_SOURCE_SETTINGS) {
										return [
											resource,
											<>
												<div className="resource__name">Source Settings</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.OBS_MUTE) {
										return [
											resource,
											<>
												<div className="resource__name">Mute</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.OBS_RENDER) {
										return [
											resource,
											<>
												<div className="resource__name">Scene Item Render</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.VMIX_INPUT) {
										return [
											resource,
											<>
												<div className="resource__details">
													<div className="resource__name" title={`Input ${resource.number}`}>
														Input {resource.number}
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
												<div className="resource__name">Input Settings</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.VMIX_AUDIO_SETTINGS) {
										return [
											resource,
											<>
												<div className="resource__name">Audio Settings</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.VMIX_OUTPUT_SETTINGS) {
										return [
											resource,
											<>
												<div className="resource__name">Output Settings</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.VMIX_OVERLAY_SETTINGS) {
										return [
											resource,
											<>
												<div className="resource__name">Overlay Settings</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.VMIX_RECORDING) {
										return [
											resource,
											<>
												<div className="resource__name">Recording</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.VMIX_STREAMING) {
										return [
											resource,
											<>
												<div className="resource__name">Streaming</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.VMIX_EXTERNAL) {
										return [
											resource,
											<>
												<div className="resource__name">External Output Settings</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.VMIX_FADE_TO_BLACK) {
										return [
											resource,
											<>
												<div className="resource__name">Fade To Black</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.VMIX_FADER) {
										return [
											resource,
											<>
												<div className="resource__name">Video Fader</div>
											</>,
										]
									} else if (resource.resourceType === ResourceType.VMIX_PREVIEW) {
										return [
											resource,
											<>
												<div className="resource__name">Preview</div>
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
