import React, { useCallback, useContext, useMemo, useState } from 'react'
import { SidebarInfoGroup } from '../SidebarInfoGroup'
import { IPCServerContext } from '../../../contexts/IPCServer'
import { ProjectContext } from '../../../contexts/Project'
import { ResourceAny } from '@shared/models'
import { ResourceData } from './ResourceData'
import { ResourceLibraryItem } from './ResourceLibraryItem'
import { Part } from '../../../../models/rundown/Part'
import { Field, Form, Formik } from 'formik'
import { findPartInRundown, getDeviceName, scatterMatchString } from '../../../../lib/util'
import { Rundown } from '../../../../models/rundown/Rundown'
import { Group } from '../../../../models/rundown/Group'
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
import { store } from '../../../mobx/store'
import { observer } from 'mobx-react-lite'
import { HiRefresh } from 'react-icons/hi'
import { useDebounce } from '../../../../lib/useDebounce'

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

const NAME_FILTER_DEBOUNCE = 100

export const ResourceLibrary: React.FC = observer(function ResourceLibrary() {
	const ipcServer = useContext(IPCServerContext)
	const rundown = store.rundownsStore.currentRundown
	const project = useContext(ProjectContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const resourcesStore = store.resourcesStore

	const defaultPart = rundown?.groups[0]?.parts[0] as Part | undefined
	const defaultLayer = Object.keys(project.mappings)[0] as string | undefined

	const [selectedResourceId, setSelectedResourceId] = useState<string | undefined>()
	const selectedResource = selectedResourceId ? resourcesStore.resources[selectedResourceId] : undefined

	const [nameFilterValue, setNameFilterValue] = React.useState('')
	const debouncedNameFilterValue = useDebounce(nameFilterValue, NAME_FILTER_DEBOUNCE)
	const [deviceFilterValue, setDeviceFilterValue] = React.useState<string[]>([])

	const sortedResources = useMemo(() => {
		return Object.values(resourcesStore.resources).sort((a, b) => {
			if (a.deviceId > b.deviceId) return 1
			if (a.deviceId < b.deviceId) return -1

			if (a.resourceType > b.resourceType) return 1
			if (a.resourceType < b.resourceType) return -1

			if (a.displayName > b.displayName) return 1
			if (a.displayName < b.displayName) return -1

			if (a.id > b.id) return 1
			if (a.id < b.id) return -1

			return 0
		})
	}, [resourcesStore.resources])
	const resourcesFilteredByDevice = useMemo(() => {
		if (deviceFilterValue.length <= 0) return sortedResources // fast path
		return sortedResources.filter((resource) => {
			return deviceFilterValue.includes(resource.deviceId)
		})
	}, [deviceFilterValue, sortedResources])

	const resourcesFilteredByDeviceAndName = useMemo(() => {
		if (debouncedNameFilterValue.trim().length === 0) return resourcesFilteredByDevice // fast path
		return resourcesFilteredByDevice.filter((resource) => {
			return (
				scatterMatchString(resource.displayName.toLowerCase(), debouncedNameFilterValue.toLowerCase()) !== null
			)
		})
	}, [debouncedNameFilterValue, resourcesFilteredByDevice])

	const filteredResourcesByDeviceId = useMemo(() => {
		const ret: { [deviceId: string]: ResourceAny[] } = {}

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

	const handleResourceLibraryItemSelect = useCallback((resource: ResourceAny) => {
		setSelectedResourceId((value) => {
			if (value === resource.id) {
				return undefined
			} else {
				return resource.id
			}
		})
	}, [])

	const handleRefresh = useCallback(async () => {
		try {
			await ipcServer.refreshResources()
		} catch (err) {
			handleError(err)
		}
	}, [ipcServer, handleError])

	if (!rundown) {
		return null
	}

	return (
		<div className="sidebar media-library-sidebar">
			<SidebarInfoGroup
				title="Available Resources"
				enableRefresh={true}
				refreshActive={resourcesStore.isAnyDeviceRefreshing()}
				onRefreshClick={handleRefresh}
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
						renderValue={(selectedDeviceIds) =>
							selectedDeviceIds.map((deviceId) => getDeviceName(project, deviceId)).join(', ')
						}
						MenuProps={MenuProps}
					>
						{deviceIds.map((deviceId) => (
							<MenuItem key={deviceId} value={deviceId}>
								<Checkbox checked={deviceFilterValue.indexOf(deviceId) > -1} />
								<ListItemText primary={getDeviceName(project, deviceId)} />
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
								<Typography variant="body2">{getDeviceName(project, deviceId)}</Typography>
								{resourcesStore.refreshStatuses[deviceId] && (
									<div className="refresh active" style={{ opacity: '0.6' }}>
										<HiRefresh size={15} color="white" />
									</div>
								)}
							</Stack>
							<Divider />
							{resources.map((resource) => {
								return (
									<ResourceLibraryItem
										key={resource.id}
										resource={resource}
										selected={resource.id === selectedResourceId}
										onSelect={handleResourceLibraryItemSelect}
									/>
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
