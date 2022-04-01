import classNames from 'classnames'
import { observer } from 'mobx-react-lite'
import React, { useContext, useEffect, useState } from 'react'
import { store } from '../../../../../mobx/store'
import { Mappings } from 'timeline-state-resolver-types'
import { useSnackbar } from 'notistack'

import { TimelineObj } from 'src/models/rundown/TimelineObj'
import { MdWarningAmber } from 'react-icons/md'
import { IPCServerContext } from '../../../../../contexts/IPCServer'
import { ErrorHandlerContext } from '../../../../../contexts/ErrorHandler'
import './style.scss'

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
	 * All timelineObj objects used in this part, required for filtering out used layers in current part from the dropdown
	 */
	timelineObjs: TimelineObj[]
}> = observer((props) => {
	const serverAPI = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const { enqueueSnackbar } = useSnackbar()
	const mappingExists = props.layerId in props.mappings
	const name = props.mappings[props.layerId]?.layerName ?? props.layerId

	const selectedItem: DropdownItem = { id: props.layerId, label: name }

	const thisLayerMapping = props.mappings[props.layerId]

	const otherItems: DropdownItem[] = Object.entries(props.mappings)
		.filter(([mappingId, mapping]) => {
			return (
				// Remove used layer from the dropdown list
				mappingId !== props.layerId &&
				// Remove all incompatible mapping types
				mapping.device === thisLayerMapping.device
			)
		})
		// Map to a simple readable format
		.map(([mappingId, mappingValue]) => ({ id: mappingId, label: mappingValue.layerName ?? 'Unknown' }))

	otherItems.push({ id: 'editMappings', label: 'Edit Mappings', className: 'editMappings' })

	return (
		<div className={classNames('layer-name', { warning: !mappingExists })}>
			{
				<LayerNamesDropdown
					selectedItem={selectedItem}
					otherItems={otherItems}
					exists={mappingExists}
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
