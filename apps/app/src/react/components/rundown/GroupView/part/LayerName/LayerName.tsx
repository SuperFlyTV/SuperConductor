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

	const selectedLayer: DropdownLayer = { layerId: layerId, label: name, deviceStatus: selectedDeviceStatus }

	const otherLayers = useMemoComputedObject(
		() => {
			const partTimeline = store.rundownsStore.getPartTimeline(partId)
			const objectsOnThisLayer = partTimeline.filter((obj) => obj.obj.layer === layerId)

			const otherLayers0: DropdownLayer[] = Object.entries(mappings)
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

					return { layerId: layerId, label: mapping.layerName ?? 'Unknown', deviceStatus: deviceStatus }
				})

			otherLayers0.push({
				layerId: 'editMappings',
				label: 'Edit Mappings',
				className: 'editMappings',
				deviceStatus: null,
			})
			return otherLayers0
		},
		[partId, mappings],
		true
	)

	return (
		<div className={classNames('layer-name', { warning: !mapping })}>
			{
				<LayerNamesDropdown
					selectedLayer={selectedLayer}
					otherLayers={otherLayers}
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

interface DropdownLayer {
	layerId: string
	label: string
	className?: string
	deviceStatus: BridgeDevice | undefined | null
}

const LayerNamesDropdown: React.FC<{
	selectedLayer: DropdownLayer
	otherLayers: DropdownLayer[]
	exists: boolean
	onSelect: (id: string) => void
	onCreateMissingMapping: (id: string) => void
	disabled: boolean
}> = (props) => {
	const [isOpen, setOpen] = useState(false)

	return (
		<div className={classNames('layer-names-dropdown', { open: isOpen, selectable: !props.disabled })}>
			<div
				className="selected-layer"
				onClick={() => {
					setOpen(props.disabled ? false : !isOpen)
				}}
			>
				<div className="layer">
					{!props.exists && (
						<div
							className="warning-icon"
							title="No mapping by this ID exists. Click here to create it."
							onClick={(e) => {
								e.preventDefault()
								e.stopPropagation()
								props.onCreateMissingMapping(props.selectedLayer.layerId)
							}}
						>
							<MdWarningAmber size={18} />
						</div>
					)}
					<div className="layer-label">{props.selectedLayer.label}</div>

					{props.selectedLayer.deviceStatus === undefined && (
						<div className="connection-status__dot" title="Device not found"></div>
					)}
					{props.selectedLayer.deviceStatus?.ok === false && (
						<div className="connection-status__dot" title="There is an issue with the device"></div>
					)}
				</div>
			</div>
			{!props.disabled && (
				<DropdownOtherLayers
					otherLayers={props.otherLayers}
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

const DropdownOtherLayers: React.FC<{
	otherLayers: DropdownLayer[]
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
		<div className="other-layers">
			{props.otherLayers.map((layer) => (
				<div
					key={layer.layerId}
					className={'layer' + (layer.className ? ' ' + layer.className : '')}
					onClick={() => {
						props.onSelect(layer.layerId)
					}}
				>
					<div className="layer-label">{layer.label}</div>
				</div>
			))}
		</div>
	)
}
