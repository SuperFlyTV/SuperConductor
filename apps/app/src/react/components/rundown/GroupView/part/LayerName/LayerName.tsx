import classNames from 'classnames'
import { observer } from 'mobx-react-lite'
import React, { useContext, useEffect, useState } from 'react'
import { store } from '../../../../../mobx/store'
import { Mapping, Mappings } from 'timeline-state-resolver-types'
import { useSnackbar } from 'notistack'
import { MdWarningAmber } from 'react-icons/md'
import { IPCServerContext } from '../../../../../contexts/IPCServer'
import { ErrorHandlerContext } from '../../../../../contexts/ErrorHandler'
import { filterMapping, sortMappings } from '../../../../../../lib/TSRMappings'
import './style.scss'
import { BridgeDevice } from '../../../../../../models/project/Bridge'
import { useMemoComputedObject } from '../../../../../mobx/lib'
import { literal } from '@shared/lib'

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
	const deviceStatus: BridgeDevice | undefined = mapping ? appStore.allDeviceStatuses[mapping.deviceId] : undefined

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

	const selectedMapping: LayersDropdownLayer = { id: layerId, label: name, deviceStatus: deviceStatus }

	const allMappings = useMemoComputedObject(
		() => {
			const partTimeline = store.rundownsStore.getPartTimeline(partId)
			const objectsOnThisLayer = partTimeline.filter((obj) => obj.obj.layer === layerId)

			const allMappings0: LayersDropdownLayer[] = sortMappings(mappings)
				.filter((m) => {
					// If uncompatible mapping-timelineObj is found, remove mapping
					for (const timelineObj of objectsOnThisLayer) {
						if (!filterMapping(m.mapping, timelineObj.obj)) {
							return false
						}
					}

					return true
				})
				// Map to a simple readable format
				.map((m) => {
					const deviceStatus = appStore.allDeviceStatuses[m.mapping.deviceId] as BridgeDevice | undefined

					return literal<LayersDropdownLayer>({
						id: m.layerId,
						label: m.mapping.layerName ?? m.layerId,
						deviceStatus: deviceStatus,
					})
				})

			return allMappings0
		},
		[partId, mappings],
		true
	)

	return (
		<div className={classNames('layer-name', { warning: !mapping })}>
			{
				<LayersNamesWithDropdown
					selectedLayer={selectedMapping}
					layers={allMappings}
					exists={!!mapping}
					disabled={locked}
					onSelect={(id: string) => {
						onSelect(id)
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

interface LayersDropdownLayer {
	id: string
	label: string
	className?: string
	deviceStatus: BridgeDevice | undefined | null
}

const LayersNamesWithDropdown: React.FC<{
	selectedLayer: LayersDropdownLayer
	layers: LayersDropdownLayer[]
	exists: boolean
	onSelect: (id: string) => void
	onCreateMissingMapping: (id: string) => void
	disabled: boolean
}> = (props) => {
	const [isOpen, setOpen] = useState(false)

	return (
		<div className={classNames('layer-names-dropdown', { open: isOpen, selectable: !props.disabled })}>
			<div
				className="selected-mapping"
				onClick={() => {
					setOpen(props.disabled ? false : !isOpen)
				}}
			>
				<div className="mapping">
					{!props.exists && (
						<div
							className="warning-icon"
							title="No mapping by this ID exists. Click here to create it."
							onClick={(e) => {
								e.preventDefault()
								e.stopPropagation()
								props.onCreateMissingMapping(props.selectedLayer.id)
							}}
						>
							<MdWarningAmber size={18} />
						</div>
					)}
					<div className="mapping-label">{props.selectedLayer.label}</div>

					{props.selectedLayer.deviceStatus === undefined && (
						<div className="connection-status__dot" title="Device not found"></div>
					)}
					{props.selectedLayer.deviceStatus?.ok === false && (
						<div className="connection-status__dot" title="There is an issue with the device"></div>
					)}
				</div>
			</div>
			{!props.disabled && (
				<DropdownSelector
					selectedLayer={props.selectedLayer}
					layers={props.layers}
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

const DropdownSelector: React.FC<{
	selectedLayer: LayersDropdownLayer
	layers: LayersDropdownLayer[]
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

	let layers = props.layers
	if (layers.length === 1 && layers[0].id === props.selectedLayer.id) {
		// special case: only one layer, don't show dropdown
		layers = []
	}

	return (
		<div className="mappings-dropdown-selector">
			{layers.map((layer) => (
				<div
					key={layer.id}
					className={classNames('mapping', layer.className, {
						selected: props.selectedLayer.id === layer.id,
					})}
					onClick={() => {
						props.onSelect(layer.id)
					}}
				>
					<div className="mapping-label">{layer.label}</div>
				</div>
			))}
			<div
				className="mapping edit-mappings"
				onClick={() => {
					store.guiStore.goToHome('mappingsSettings')
				}}
			>
				<div className="mapping-label">Edit Mappings</div>
			</div>
		</div>
	)
}
