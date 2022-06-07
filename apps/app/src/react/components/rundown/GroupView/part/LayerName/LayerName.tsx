import classNames from 'classnames'
import { observer } from 'mobx-react-lite'
import React, { useContext, useEffect, useState } from 'react'
import { store } from '../../../../../mobx/store'
import { Mapping, Mappings } from 'timeline-state-resolver-types'
import { useSnackbar } from 'notistack'
import { TimelineObj } from '../../../../../../models/rundown/TimelineObj'
import { MdWarningAmber } from 'react-icons/md'
import { IPCServerContext } from '../../../../../contexts/IPCServer'
import { ErrorHandlerContext } from '../../../../../contexts/ErrorHandler'
import { filterMapping } from '../../../../../../lib/TSRMappings'
import './style.scss'
import { BridgeDevice } from '../../../../../../models/project/Bridge'

export const LayerName: React.FC<{
	/**
	 * ID of the selected layer
	 */
	layerId: string
	/**
	 * Project mappings, used for generating dropdown list of available options
	 */
	mappings: Mappings
	/**
	 * Executes when dropdown item (layerId) is selected - not fired if "Edit Mappings" is selected
	 */
	onSelect: (id: string) => void
	/**
	 * timelineObj objects used in this layer, required for filtering out available mappings
	 */
	objectsOnThisLayer: TimelineObj[]
}> = observer(function LayerName(props) {
	const serverAPI = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const appStore = store.appStore

	const { enqueueSnackbar } = useSnackbar()
	const mapping = props.mappings[props.layerId] as Mapping | undefined
	const name = mapping?.layerName ?? props.layerId

	let selectedDeviceStatus: BridgeDevice | undefined = undefined
	if (mapping) {
		selectedDeviceStatus = appStore.allDeviceStatuses[mapping.deviceId]
	}

	const selectedItem: DropdownItem = { id: props.layerId, label: name, deviceStatus: selectedDeviceStatus }

	const otherItems: DropdownItem[] = Object.entries(props.mappings)
		.filter(([mappingId, mapping]) => {
			// Remove used layer from the dropdown list
			const isUsedLayer = mappingId === props.layerId
			if (isUsedLayer) {
				return false
			}

			// If uncompatible mapping-timelineObj is found, remove mapping
			for (const timelineObj of props.objectsOnThisLayer) {
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

	otherItems.push({ id: 'editMappings', label: 'Edit Mappings', className: 'editMappings', deviceStatus: null })

	return (
		<div className={classNames('layer-name', { warning: !mapping })}>
			{
				<LayerNamesDropdown
					selectedItem={selectedItem}
					otherItems={otherItems}
					exists={!!mapping}
					onSelect={(id: string) => {
						if (id === 'editMappings') {
							store.guiStore.goToHome('mappingsSettings')
						} else {
							props.onSelect(id)
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
}> = (props) => {
	const [isOpen, setOpen] = useState(false)

	return (
		<div className={classNames('layer-names-dropdown', { open: isOpen })}>
			<div
				className="selected-item"
				onClick={() => {
					setOpen(!isOpen)
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
			<DropdownOtherItems
				otherItems={props.otherItems}
				onSelect={(id: string) => {
					props.onSelect(id)
					setOpen(false)
				}}
				onClickOutside={() => setOpen(false)}
			/>
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
