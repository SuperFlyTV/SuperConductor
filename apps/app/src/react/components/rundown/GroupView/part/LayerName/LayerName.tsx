import classNames from 'classnames'
import { observer } from 'mobx-react-lite'
import React, { useContext, useEffect, useState } from 'react'
import { store } from '../../../../../mobx/store'
import { Mapping, Mappings } from 'timeline-state-resolver-types'
import { useSnackbar } from 'notistack'
import { MdWarningAmber } from 'react-icons/md'
import { IPCServerContext } from '../../../../../contexts/IPCServer'
import { ErrorHandlerContext } from '../../../../../contexts/ErrorHandler'
import { filterMapping } from '../../../../../../lib/TSRMappings'
import './style.scss'
import { BridgeDevice } from '../../../../../../models/project/Bridge'
import { useMemoComputedObject } from '../../../../../mobx/lib'

export const LayerName: React.FC<{
	rundownId: string
	groupId: string
	partId: string
	/**
	 * ID of the selected layer
	 */
	layerId: string
	/**
	 * Project mappings, used for generating dropdown list of available options
	 */
	mappings: Mappings
	locked: boolean
}> = observer(function LayerName({ rundownId, groupId, partId, layerId, mappings, locked }) {
	const serverAPI = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const appStore = store.appStore

	const { enqueueSnackbar } = useSnackbar()
	const mapping = mappings[layerId] as Mapping | undefined
	const name = mapping?.layerName ?? layerId

	const onSelect = (selectedLayerId: string) => {
		const partTimeline = store.rundownsStore.getPartTimeline(partId)
		const objectsOnThisLayer = partTimeline.filter((obj) => obj.obj.layer === layerId)

		// Move all object on this layer to the new layer:
		for (const objOrg of objectsOnThisLayer) {
			// Set new layer:

			serverAPI
				.updateTimelineObj({
					rundownId: rundownId,
					groupId: groupId,
					partId: partId,
					timelineObj: {
						obj: {
							layer: selectedLayerId,
						},
					},
					timelineObjId: objOrg.obj.id,
				})
				.catch(handleError)
		}
	}

	let selectedDeviceStatus: BridgeDevice | undefined = undefined
	if (mapping) {
		selectedDeviceStatus = appStore.allDeviceStatuses[mapping.deviceId]
	}

	const selectedItem: DropdownItem = { id: layerId, label: name, deviceStatus: selectedDeviceStatus }

	const otherItems = useMemoComputedObject(
		() => {
			const partTimeline = store.rundownsStore.getPartTimeline(partId)
			const objectsOnThisLayer = partTimeline.filter((obj) => obj.obj.layer === layerId)

			const otherItems0: DropdownItem[] = Object.entries(mappings)
				.filter(([mappingId, mapping]) => {
					// Remove used layer from the dropdown list
					const isUsedLayer = mappingId === layerId
					if (isUsedLayer) {
						return false
					}

					// If uncompatible mapping-timelineObj is found, remove mapping
					for (const timelineObj of objectsOnThisLayer) {
						if (!filterMapping(mapping, timelineObj.obj)) {
							return false
						}
					}

					return true
				})
				// Map to a simple readable format
				.map(([layerId, mapping]) => {
					const deviceStatus = appStore.allDeviceStatuses[mapping.deviceId] as BridgeDevice | undefined

					return { id: layerId, label: mapping.layerName ?? 'Unknown', deviceStatus: deviceStatus }
				})

			otherItems0.push({
				id: 'editMappings',
				label: 'Edit Mappings',
				className: 'editMappings',
				deviceStatus: null,
			})
			return otherItems0
		},
		[partId, mappings],
		true
	)

	return (
		<div className={classNames('layer-name', { warning: !mapping })}>
			{
				<LayerNamesDropdown
					selectedItem={selectedItem}
					otherItems={otherItems}
					exists={!!mapping}
					disabled={locked}
					onSelect={(id: string) => {
						if (id === 'editMappings') {
							store.guiStore.goToHome('mappingsSettings')
						} else {
							onSelect(id)
						}
					}}
					onCreateMissingMapping={(id: string) => {
						if (!store.rundownsStore.currentRundownId) {
							return
						}
						serverAPI
							.createMissingMapping({
								rundownId: store.rundownsStore.currentRundownId,
								mappingId: id,
							})
							.then(() => {
								enqueueSnackbar(`Mapping "${id}" created.`, { variant: 'success' })
								store.guiStore.goToHome('mappingsSettings')
							})
							.catch(handleError)
					}}
				/>
			}
		</div>
	)
})

/** Analogue to LayerName, used in initial-renders */
export function LayerNameEmpty(): JSX.Element {
	return <div className="layer-name" />
}

interface DropdownItem {
	id: string
	label: string
	className?: string
	deviceStatus: BridgeDevice | undefined | null
}

const LayerNamesDropdown: React.FC<{
	selectedItem: DropdownItem
	otherItems: DropdownItem[]
	exists: boolean
	onSelect: (id: string) => void
	onCreateMissingMapping: (id: string) => void
	disabled: boolean
}> = (props) => {
	const [isOpen, setOpen] = useState(false)

	return (
		<div className={classNames('layer-names-dropdown', { open: isOpen, selectable: !props.disabled })}>
			<div
				className="selected-item"
				onClick={() => {
					setOpen(props.disabled ? false : !isOpen)
				}}
			>
				<div className="item">
					{!props.exists && (
						<div
							className="warning-icon"
							title="No mapping by this ID exists. Click here to create it."
							onClick={(e) => {
								e.preventDefault()
								e.stopPropagation()
								props.onCreateMissingMapping(props.selectedItem.id)
							}}
						>
							<MdWarningAmber size={18} />
						</div>
					)}
					<div className="item-label">{props.selectedItem.label}</div>

					{props.selectedItem.deviceStatus === undefined && (
						<div className="connection-status__dot" title="Device not found"></div>
					)}
					{props.selectedItem.deviceStatus?.ok === false && (
						<div className="connection-status__dot" title="There is an issue with the device"></div>
					)}
				</div>
			</div>
			{!props.disabled && (
				<DropdownOtherItems
					otherItems={props.otherItems}
					onSelect={(id: string) => {
						props.onSelect(id)
						setOpen(false)
					}}
					onClickOutside={() => setOpen(false)}
				/>
			)}
		</div>
	)
}

const DropdownOtherItems: React.FC<{
	otherItems: DropdownItem[]
	onSelect: (id: string) => void
	onClickOutside: () => void
}> = (props) => {
	/**
	 * Add event listener so dropdown is closed when user clicks outside of the dropdown
	 */
	useEffect(() => {
		const onMouseDown = (e: MouseEvent) => {
			if (!(e.target as HTMLElement).closest('.layer-names-dropdown.open')) {
				props.onClickOutside()
			}
		}

		document.addEventListener('mousedown', onMouseDown)
		return () => {
			document.removeEventListener('mousedown', onMouseDown)
		}
	}, [props])

	return (
		<div className="other-items">
			{props.otherItems.map((item) => (
				<div
					key={item.id}
					className={'item' + (item.className ? ' ' + item.className : '')}
					onClick={() => {
						props.onSelect(item.id)
					}}
				>
					<div className="item-label">{item.label}</div>
				</div>
			))}
		</div>
	)
}
