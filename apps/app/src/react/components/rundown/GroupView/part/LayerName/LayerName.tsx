import classNames from 'classnames'
import { observer } from 'mobx-react-lite'
import React, { useEffect, useState } from 'react'
import { store } from '../../../../../mobx/store'
import { Mappings } from 'timeline-state-resolver-types'

import './style.scss'
import { TimelineObj } from 'src/models/rundown/TimelineObj'

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
	const name = props.mappings[props.layerId]?.layerName ?? 'Unknown'

	const selectedItem: DropdownItem = { id: props.layerId, label: name }

	const otherItems: DropdownItem[] = Object.entries(props.mappings)
		// Remove all used layers in this part from the dropdown list
		.filter(
			(mappingKeyArray) => !props.timelineObjs.find((timelineObj) => timelineObj.obj.layer === mappingKeyArray[0])
		)
		// Map to a simple readable format
		.map((mappingKeyArray) => ({ id: mappingKeyArray[0], label: mappingKeyArray[1].layerName ?? 'Unknown' }))

	otherItems.push({ id: 'editMappings', label: 'Edit Mappings', className: 'editMappings' })

	return (
		<div className="layer-name">
			{
				<LayerNamesDropdown
					selectedItem={selectedItem}
					otherItems={otherItems}
					onSelect={(id: string) => {
						if (id === 'editMappings') {
							store.guiStore.activeTabId = 'project'
							store.guiStore.activeProjectPageId = 'mappingsSettings'
						} else {
							props.onSelect(id)
						}
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
	onSelect: (id: string) => void
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
				<div className="item">{props.selectedItem.label}</div>
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
					{item.label}
				</div>
			))}
		</div>
	)
}
