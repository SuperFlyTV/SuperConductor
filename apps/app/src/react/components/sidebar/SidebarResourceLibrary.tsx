import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { SidebarContent } from './SidebarContent.js'
import { IPCServerContext } from '../../contexts/IPCServer.js'
import { ProjectContext } from '../../contexts/Project.js'
import {
	protectString,
	protectStringArray,
	ResourceAny,
	ResourceId,
	ResourceType,
	TSRDeviceId,
	unprotectString,
} from '@shared/models'
import { flatten } from '@shared/lib'
import { ResourceData } from './resource/ResourceData.js'
import { ResourceLibraryItem } from './resource/ResourceLibraryItem.js'
import { Field, Form, Formik } from 'formik'
import { getDeviceName, getResourceTypeName, rateLimitIgnore, scatterMatchString } from '../../../lib/util.js'

import {
	Button,
	FormControl,
	Grid,
	InputLabel,
	ListItemText,
	MenuItem,
	OutlinedInput,
	Typography,
	Select,
	SelectChangeEvent,
	Stack,
	ButtonGroup,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Badge,
	InputAdornment,
	IconButton,
} from '@mui/material'
import { TextField as FormikMuiTextField } from 'formik-mui'
import { ErrorHandlerContext } from '../../contexts/ErrorHandler.js'
import { store } from '../../mobx/store.js'
import { observer } from 'mobx-react-lite'
import { HiRefresh, HiChevronDown, HiOutlineX } from 'react-icons/hi'
import { useDebounce } from '../../lib/useDebounce.js'
import { sortMappings } from '../../../lib/TSRMappings.js'
import { useMemoComputedArray, useMemoComputedObject, useMemoComputedValue } from '../../mobx/lib.js'
import classNames from 'classnames'
import { ScrollWatcher } from '../rundown/ScrollWatcher/ScrollWatcher.js'
import { computed } from 'mobx'
import sorensen from '@sofie-automation/sorensen'
import { CB } from '../../lib/errorHandling.js'
import { SmallCheckbox } from '../util/SmallCheckbox.js'

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

	const {
		selectedResourceIds,
		nameFilterValue,
		deviceFilterValue,
		resourceTypeFilterValue,
		detailedFiltersExpanded,
	} = computed(() => store.guiStore.resourceLibrary).get()
	const selectedResource = useMemoComputedObject(
		() =>
			selectedResourceIds.length === 1
				? store.resourcesAndMetadataStore.resources.get(selectedResourceIds[0])
				: undefined,
		[selectedResourceIds]
	)
	const refreshStatuses = useMemoComputedObject(() => store.resourcesAndMetadataStore.refreshStatuses, [])
	const debouncedNameFilterValue = useDebounce(nameFilterValue, NAME_FILTER_DEBOUNCE)

	const sortedResources = useMemoComputedArray(() => {
		return Array.from(store.resourcesAndMetadataStore.resources.values()).sort((a, b) => {
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

	const resourceTypes = useMemo(() => {
		const resourceTypeSet = new Set<ResourceType>()
		resourcesFilteredByDevice.forEach((resource) => {
			resourceTypeSet.add(resource.resourceType)
		})
		return Array.from(resourceTypeSet.values())
	}, [resourcesFilteredByDevice])

	const resourcesFilteredByType = useMemo(() => {
		if (resourceTypeFilterValue.length <= 0) return resourcesFilteredByDevice
		return resourcesFilteredByDevice.filter((resource) => {
			return resourceTypeFilterValue.includes(resource.resourceType)
		})
	}, [resourcesFilteredByDevice, resourceTypeFilterValue])

	const resourcesFilteredByDeviceAndName = useMemo(() => {
		if (debouncedNameFilterValue.trim().length === 0) return resourcesFilteredByType // fast path
		return resourcesFilteredByType.filter((resource) => {
			return (
				scatterMatchString(resource.displayName.toLowerCase(), debouncedNameFilterValue.toLowerCase()) !== null
			)
		})
	}, [debouncedNameFilterValue, resourcesFilteredByType])

	const filteredResourcesByDeviceId = useMemo(() => {
		const ret = new Map<TSRDeviceId, ResourceAny[]>()

		for (const resource of resourcesFilteredByDeviceAndName) {
			let r = ret.get(resource.deviceId)
			if (!r) {
				r = []
				ret.set(resource.deviceId, r)
			}
			r.push(resource)
		}
		return ret
	}, [resourcesFilteredByDeviceAndName])

	const deviceIds = useMemo(() => {
		const deviceIds = new Set<TSRDeviceId>()
		for (const bridgeId in project.bridges) {
			const bridge = project.bridges[bridgeId]
			for (const deviceId in bridge.settings.devices) {
				deviceIds.add(protectString<TSRDeviceId>(deviceId))
			}
		}
		return Array.from(deviceIds)
	}, [project.bridges])

	const handleExpandDetailedFilter = useCallback((e: React.SyntheticEvent, expanded: boolean) => {
		store.guiStore.updateResourceLibrary({
			// On autofill we get a stringified value.
			detailedFiltersExpanded: expanded,
		})
	}, [])

	const handleClearNameFilter = useCallback(() => {
		store.guiStore.updateResourceLibrary({
			nameFilterValue: '',
		})
	}, [])

	const handleClearDetailedFilter = useCallback((e: React.MouseEvent<HTMLElement>) => {
		e.preventDefault()
		e.stopPropagation()
		store.guiStore.updateResourceLibrary({
			deviceFilterValue: [],
			resourceTypeFilterValue: [],
		})
	}, [])

	const handleDeviceFilterChange = useCallback((event: SelectChangeEvent<typeof deviceFilterValue>) => {
		const {
			target: { value },
		} = event
		store.guiStore.updateResourceLibrary({
			// On autofill we get a stringified value.
			deviceFilterValue: Array.isArray(value) ? value : protectStringArray(value.split(',')),
		})
	}, [])

	const handleResourceTypeFilterChange = useCallback((event: SelectChangeEvent<typeof resourceTypeFilterValue>) => {
		const {
			target: { value },
		} = event
		store.guiStore.updateResourceLibrary({
			// On autofill we get a stringified value.
			resourceTypeFilterValue: typeof value === 'string' ? value.split(',') : value,
		})
	}, [])

	const handleRefreshAuto = useCallback(
		(interval: number) => {
			ipcServer.refreshResourcesSetAuto({ interval }).catch(handleError)
		},
		[ipcServer, handleError]
	)
	const isAnyDeviceRefreshing = useMemoComputedValue(
		() => store.resourcesAndMetadataStore.isAnyDeviceRefreshing(),
		[]
	)

	const allListItems = useMemo(() => {
		const allListItems: RowItem[] = []
		for (const [deviceId, resources] of filteredResourcesByDeviceId.entries()) {
			allListItems.push({
				type: 'device',
				key: `__device${deviceId}`,
				deviceId,
				resourceCount: resources.length,
			})
			for (const resource of resources) {
				allListItems.push({
					type: 'resource',
					key: unprotectString(resource.id),
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
					? allListItems.findIndex(
							(i) => i.type === 'resource' && i.key === unprotectString(lastSelectedResourceId)
					  )
					: 0
				const thisIndex = allListItems.findIndex(
					(i) => i.type === 'resource' && i.key === unprotectString(resource.id)
				)
				if (mainIndex === -1 || thisIndex === -1) return
				if (mainIndex < thisIndex) {
					for (let i = mainIndex + 1; i <= thisIndex; i++) {
						const item = allListItems[i]
						if (item.type === 'resource') {
							const protectedKey = protectString<ResourceId>(item.key)
							const foundIndex = selectedResourceIds.indexOf(protectedKey)
							if (foundIndex === -1) {
								selectedResourceIds.push(protectedKey)
							}
						}
					}
				} else if (mainIndex > thisIndex) {
					for (let i = mainIndex - 1; i >= thisIndex; i--) {
						const item = allListItems[i]
						if (item.type === 'resource') {
							const protectedKey = protectString<ResourceId>(item.key)
							const foundIndex = selectedResourceIds.indexOf(protectedKey)
							if (foundIndex === -1) {
								selectedResourceIds.push(protectedKey)
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

	const detailedFiltersCount = useMemo(
		() =>
			// count the amount of individual filters (not filter-elements) that are active
			[deviceFilterValue.length > 0, resourceTypeFilterValue.length > 0].reduce(
				(previous, current) => previous + (current ? 1 : 0),
				0
			),
		[deviceFilterValue, resourceTypeFilterValue]
	)
	const hasDetailedFilters = detailedFiltersCount > 0
	const hasNameFilter = nameFilterValue !== ''

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
							onClick={(): void => {
								ipcServer.refreshResources().catch(handleError)
							}}
							title="Refresh all resources"
						>
							<HiRefresh size={15} color="white" />
						</Button>
					</ButtonGroup>
				</div>
			</div>

			<FormControl fullWidth size="small" sx={{ my: 1 }}>
				<InputLabel htmlFor="resource-library-name-filter">Filter Resources by Name</InputLabel>
				<OutlinedInput
					id="resource-library-name-filter"
					value={nameFilterValue}
					onChange={(event) => {
						store.guiStore.updateResourceLibrary({
							nameFilterValue: event.target.value,
						})
					}}
					endAdornment={
						hasNameFilter && (
							<InputAdornment position="end">
								<IconButton aria-label="Clear name filter" edge="end" onClick={handleClearNameFilter}>
									<HiOutlineX />
								</IconButton>
							</InputAdornment>
						)
					}
					label="Filter Resources by Name"
				/>
			</FormControl>

			<Accordion expanded={detailedFiltersExpanded} onChange={handleExpandDetailedFilter}>
				<AccordionSummary expandIcon={<HiChevronDown />} aria-controls="panel1bh-content" id="panel1bh-header">
					<Typography>
						<Badge badgeContent={detailedFiltersCount} color="primary" hidden={!hasDetailedFilters}>
							Detailed filters
						</Badge>
						{detailedFiltersCount > 0 && (
							<IconButton
								aria-label="Clear detailed filters"
								edge="end"
								onClick={handleClearDetailedFilter}
								sx={{ m: 0, p: 0, ml: 3 }}
							>
								<HiOutlineX />
							</IconButton>
						)}
					</Typography>
				</AccordionSummary>
				<AccordionDetails>
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
								<MenuItem key={unprotectString(deviceId)} value={unprotectString(deviceId)} dense>
									<SmallCheckbox checked={deviceFilterValue.indexOf(deviceId) > -1} />
									<ListItemText primary={getDeviceName(project, deviceId)} />
								</MenuItem>
							))}
						</Select>
					</FormControl>
					<FormControl margin="dense" size="small" fullWidth>
						<InputLabel id="resource-library-resource-type-filter-label">
							Filter Resources by Type
						</InputLabel>
						<Select
							labelId="resource-library-resource-type-filter-label"
							id="resource-library-resource-type-filter"
							multiple
							value={resourceTypeFilterValue}
							onChange={handleResourceTypeFilterChange}
							input={<OutlinedInput label="Filter Resources by Type" />}
							renderValue={(selectedResourceTypes) =>
								selectedResourceTypes
									.map((resourceType) => getResourceTypeName(resourceType as ResourceType))
									.join(', ')
							}
							MenuProps={MenuProps}
						>
							{resourceTypes.map((resourceType) => (
								<MenuItem key={resourceType} value={resourceType} dense>
									<SmallCheckbox checked={resourceTypeFilterValue.indexOf(resourceType) > -1} />
									<ListItemText primary={getResourceTypeName(resourceType)} />
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</AccordionDetails>
			</Accordion>
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
									key={unprotectString(item.deviceId)}
									deviceName={getDeviceName(project, item.deviceId)}
									isRefreshing={refreshStatuses.has(item.deviceId)}
									resourceCount={item.resourceCount}
								/>
							)
						} else {
							return (
								<React.Fragment key={unprotectString(item.resource.id)}>
									<ResourceLibraryItem
										resource={item.resource}
										selected={selectedResourceIds.includes(item.resource.id)}
										onSelect={handleResourceLibraryItemSelect}
									/>
									{selectedResource &&
										currentRundownId &&
										item.resource.id === selectedResource.id && (
											<>
												<ResourceData resource={item.resource} />
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
			deviceId: TSRDeviceId
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
