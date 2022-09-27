import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { SidebarContent } from './SidebarContent'
import { IPCServerContext } from '../../contexts/IPCServer'
import { ProjectContext } from '../../contexts/Project'
import { ResourceAny } from '@shared/models'
import { flatten } from '@shared/lib'
import { ResourceData } from './resource/ResourceData'
import { ResourceLibraryItem } from './resource/ResourceLibraryItem'
import { Field, Form, Formik } from 'formik'
import { getDeviceName, rateLimitIgnore, scatterMatchString } from '../../../lib/util'

import {
	Button,
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
	ButtonGroup,
} from '@mui/material'
import { TextField as FormikMuiTextField } from 'formik-mui'
import { ErrorHandlerContext } from '../../contexts/ErrorHandler'
import { store } from '../../mobx/store'
import { observer } from 'mobx-react-lite'
import { HiRefresh } from 'react-icons/hi'
import { useDebounce } from '../../lib/useDebounce'
import { sortMappings } from '../../../lib/TSRMappings'
import { useMemoComputedArray, useMemoComputedObject, useMemoComputedValue } from '../../mobx/lib'
import classNames from 'classnames'
import { ScrollWatcher } from '../rundown/ScrollWatcher/ScrollWatcher'
import { computed } from 'mobx'
import sorensen from '@sofie-automation/sorensen'
import { CB } from '../../lib/errorHandling'

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

export const SidebarResourceLibrary: React.FC = observer(function SidebarResourceLibrary() {
	const ipcServer = useContext(IPCServerContext)

	const project = useContext(ProjectContext)
	const { handleError } = useContext(ErrorHandlerContext)

	let currentRundownId: string | undefined = store.rundownsStore.currentRundownId
	if (currentRundownId && !store.rundownsStore.hasRundown(currentRundownId)) {
		currentRundownId = undefined
	}

	const { selectedResourceIds, nameFilterValue, deviceFilterValue } = computed(
		() => store.guiStore.resourceLibrary
	).get()
	const selectedResource = useMemoComputedObject(
		() => (selectedResourceIds.length === 1 ? store.resourcesStore.resources[selectedResourceIds[0]] : undefined),
		[selectedResourceIds]
	)
	const refreshStatuses = useMemoComputedObject(() => store.resourcesStore.refreshStatuses, [])
	const debouncedNameFilterValue = useDebounce(nameFilterValue, NAME_FILTER_DEBOUNCE)

	const sortedResources = useMemoComputedArray(() => {
		return Object.values(store.resourcesStore.resources).sort((a, b) => {
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
	}, [])
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
		store.guiStore.updateResourceLibrary({
			// On autofill we get a stringified value.
			deviceFilterValue: typeof value === 'string' ? value.split(',') : value,
		})
	}, [])

	const handleRefreshAuto = useCallback(
		(interval: number) => {
			ipcServer.refreshResourcesSetAuto(interval).catch(handleError)
		},
		[ipcServer, handleError]
	)
	const isAnyDeviceRefreshing = useMemoComputedValue(() => store.resourcesStore.isAnyDeviceRefreshing(), [])

	const allListItems = useMemo(() => {
		const allListItems: RowItem[] = []
		for (const [deviceId, resources] of Object.entries(filteredResourcesByDeviceId)) {
			allListItems.push({
				type: 'device',
				key: `__device${deviceId}`,
				deviceId,
				resourceCount: resources.length,
			})
			for (const resource of resources) {
				allListItems.push({
					type: 'resource',
					key: resource.id,
					resource,
				})
			}
		}
		return allListItems
	}, [filteredResourcesByDeviceId])

	const handleResourceLibraryItemSelect = useCallback(
		(resource: ResourceAny) => {
			const selectedResourceIds = store.guiStore.resourceLibrary.selectedResourceIds
			let lastSelectedResourceId = store.guiStore.resourceLibrary.lastSelectedResourceId

			const pressed = sorensen.getPressedKeys()
			if (pressed.includes('ControlLeft') || pressed.includes('ControlRight')) {
				// Add this group to the selection, or remove it if it's already there:
				const foundIndex = selectedResourceIds.indexOf(resource.id)
				if (foundIndex === -1) {
					selectedResourceIds.push(resource.id)
					lastSelectedResourceId = resource.id
				} else {
					// unselect
					selectedResourceIds.splice(foundIndex, 1)
					lastSelectedResourceId = null
				}
			} else if (pressed.includes('ShiftLeft') || pressed.includes('ShiftRight')) {
				// Add all resources between the last selected and this one:

				const mainIndex = lastSelectedResourceId
					? allListItems.findIndex((i) => i.type === 'resource' && i.key === lastSelectedResourceId)
					: 0
				const thisIndex = allListItems.findIndex((i) => i.type === 'resource' && i.key === resource.id)
				if (mainIndex === -1 || thisIndex === -1) return
				if (mainIndex < thisIndex) {
					for (let i = mainIndex + 1; i <= thisIndex; i++) {
						const item = allListItems[i]
						if (item.type === 'resource') {
							const foundIndex = selectedResourceIds.indexOf(item.key)
							if (foundIndex === -1) {
								selectedResourceIds.push(item.key)
							}
						}
					}
				} else if (mainIndex > thisIndex) {
					for (let i = mainIndex - 1; i >= thisIndex; i--) {
						const item = allListItems[i]
						if (item.type === 'resource') {
							const foundIndex = selectedResourceIds.indexOf(item.key)
							if (foundIndex === -1) {
								selectedResourceIds.push(item.key)
							}
						}
					}
				}
				lastSelectedResourceId = resource.id
			} else {
				// Set the selection to be this only:

				const foundIndex = selectedResourceIds.indexOf(resource.id)
				if (foundIndex === -1 || selectedResourceIds.length > 1) {
					selectedResourceIds.splice(0, 99999)
					selectedResourceIds.push(resource.id)
					lastSelectedResourceId = resource.id
				} else {
					// unselect
					selectedResourceIds.splice(0, 99999)
					lastSelectedResourceId = null
				}
			}
			store.guiStore.updateResourceLibrary({
				selectedResourceIds,
				lastSelectedResourceId,
			})
		},
		[allListItems]
	)

	const MIN_LIMIT = 10
	const [listItemsLimit, setListItemsLimit] = useState(MIN_LIMIT)
	const listLength = useRef(allListItems.length)
	useEffect(() => {
		listLength.current = allListItems.length
		if (listItemsLimit > allListItems.length) {
			const newLimit = Math.max(MIN_LIMIT, allListItems.length)
			setListItemsLimit(newLimit)
		}
	}, [allListItems.length, listItemsLimit])
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const loadMoreItems = useCallback(
		rateLimitIgnore(
			CB(() => {
				setListItemsLimit((value) => {
					const newLimit = Math.max(MIN_LIMIT, Math.min(listLength.current, value + 10))
					return newLimit
				})
			}),
			100
		),
		[]
	)

	if (!currentRundownId) {
		return null
	}

	const header = (
		<>
			<div className="title">
				<span>Available Resources</span>

				<div className="refresh-resources">
					<ButtonGroup className="">
						<Button className="on-hover" onClick={() => handleRefreshAuto(0)} title="Turn off auto refresh">
							Auto: Off
						</Button>
						<Button
							className={classNames('on-hover', { selected: project.autoRefreshInterval === 1000 })}
							onClick={() => handleRefreshAuto(1000)}
							title="Refresh resources every second"
						>
							1s
						</Button>
						<Button
							className={classNames('on-hover', { selected: project.autoRefreshInterval === 10000 })}
							onClick={() => handleRefreshAuto(10000)}
							title="Refresh resources every 10 seconds"
						>
							10s
						</Button>
						<Button
							className={classNames('on-hover', { selected: project.autoRefreshInterval === 60000 })}
							onClick={() => handleRefreshAuto(60000)}
							title="Refresh resources every minute"
						>
							1m
						</Button>

						<Button
							className={classNames('refresh', { active: isAnyDeviceRefreshing })}
							onClick={() => ipcServer.refreshResources().catch(handleError)}
							title="Refresh all resources"
						>
							<HiRefresh size={15} color="white" />
						</Button>
					</ButtonGroup>
				</div>
			</div>

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
					store.guiStore.updateResourceLibrary({
						nameFilterValue: event.target.value,
					})
				}}
			/>
		</>
	)
	const displayItems = allListItems.slice(0, listItemsLimit)
	return (
		<div>
			<SidebarContent title={header} className="resource-library">
				<ScrollWatcher
					onNearBottom={loadMoreItems}
					totalCount={allListItems.length}
					currentCount={displayItems.length}
					childHeight={40}
				>
					{displayItems.map((item) => {
						if (item.type === 'device') {
							return (
								<DeviceHeader
									key={item.deviceId}
									deviceName={getDeviceName(project, item.deviceId)}
									isRefreshing={refreshStatuses[item.deviceId]}
									resourceCount={item.resourceCount}
								/>
							)
						} else {
							return (
								<React.Fragment key={item.resource.id}>
									<ResourceLibraryItem
										resource={item.resource}
										selected={selectedResourceIds.includes(item.resource.id)}
										onSelect={handleResourceLibraryItemSelect}
									/>
									{selectedResource && currentRundownId && item.resource.id === selectedResource.id && (
										<>
											<ResourceData resource={item.resource} />
											{/* <AddToTimeline
												currentRundownId={currentRundownId}
												resource={item.resource}
											/> */}
										</>
									)}
								</React.Fragment>
							)
						}
					})}
				</ScrollWatcher>
			</SidebarContent>
		</div>
	)
})

type RowItem =
	| {
			type: 'device'
			key: string
			deviceId: string
			resourceCount: number
	  }
	| {
			type: 'resource'
			key: string
			resource: ResourceAny
	  }

export const DeviceHeader: React.FC<{
	deviceName: string
	resourceCount: number
	isRefreshing: boolean
}> = function DeviceHeader({ deviceName, resourceCount, isRefreshing }) {
	return (
		<Stack direction="row" justifyContent="space-between">
			<Typography variant="body2">{deviceName}</Typography>

			{isRefreshing ? (
				<div className="refresh-icon refresh active" style={{ opacity: '0.6', height: '14px' }}>
					<HiRefresh size={12} color="white" />
				</div>
			) : (
				<Typography variant="body2"> ({resourceCount}) </Typography>
			)}
		</Stack>
	)
}
export const AddToTimeline: React.FC<{
	currentRundownId: string
	resource: ResourceAny
}> = observer(function AddToTimeline({ currentRundownId, resource }) {
	const ipcServer = useContext(IPCServerContext)

	const project = useContext(ProjectContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const defaultPart = useMemoComputedObject(() => {
		if (!currentRundownId) return undefined

		const firstGroup = store.rundownsStore.getRundownGroups(currentRundownId)[0]
		if (!firstGroup) return undefined
		const firstPartId = firstGroup.partIds[0]
		if (!firstPartId) return undefined
		return {
			rundownId: currentRundownId,
			groupId: firstGroup.id,
			partId: firstPartId,
		}
	}, [currentRundownId])
	const defaultLayer = Object.keys(project.mappings)[0] as string | undefined
	const allPartsInRundown = useMemoComputedArray(() => {
		if (!currentRundownId) return []

		return flatten(
			store.rundownsStore.getRundownGroups(currentRundownId).map((group) => {
				const parts = store.rundownsStore.getGroupParts(group.id)

				return parts.map((part) => ({
					partId: part.id,
					partName: part.name,
					groupId: group.id,
					groupName: group.name,
					groupTransparent: group.transparent,
				}))
			})
		)
	}, [currentRundownId])

	if (!defaultPart) return null
	if (!defaultLayer) return null

	return (
		<div className="add-to-timeline">
			<Formik
				initialValues={{
					rundownId: defaultPart.rundownId,
					groupId: defaultPart.groupId,
					partId: defaultPart.partId,
					layerId: defaultLayer,
				}}
				onSubmit={(values, actions) => {
					if (!values.rundownId || !values.groupId || !values.partId || !values.layerId) {
						actions.setSubmitting(false)
						return
					}

					const part = store.rundownsStore.getPart(values.partId)
					if (!part) {
						actions.setSubmitting(false)
						return
					}

					ipcServer
						.addResourcesToTimeline({
							rundownId: values.rundownId,
							groupId: values.groupId,
							partId: values.partId,
							layerId: values.layerId,
							resourceIds: [resource.id],
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
										{allPartsInRundown.map((p) => {
											return (
												<MenuItem key={p.partId} value={p.partId}>
													{p.groupTransparent ? p.partName : `${p.groupName}: ${p.partName}`}
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
										{sortMappings(project.mappings).map(({ layerId, mapping }) => (
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
	)
})
