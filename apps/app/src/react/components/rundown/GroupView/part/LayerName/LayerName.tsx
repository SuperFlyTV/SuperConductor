import classNames from 'classnames'
import React, { useEffect, useState } from 'react'
import { Mappings } from 'timeline-state-resolver-types'

import './style.scss'

export const LayerName: React.FC<{ layerId: string; mappings: Mappings; onSelect: (id: string) => void }> = (props) => {
	const name = props.mappings[props.layerId]?.layerName ?? 'Unknown'

	const selectedItem: DropdownItem = { id: props.layerId, label: name }

	const otherItems: DropdownItem[] = Object.entries(props.mappings)
		// Remove selected item from list of all other items
		.filter((mappingKeyArray) => mappingKeyArray[0] !== props.layerId)
		// Map to a simple readable format
		.map((mappingKeyArray) => ({ id: mappingKeyArray[0], label: mappingKeyArray[1].layerName ?? 'Unknown' }))

	return (
		<div className="layer-name">
			{
				<LayerNamesDropdown
					selectedItem={selectedItem}
					otherItems={otherItems}
					onSelect={(id: string) => {
						if (id === 'editMappings') {
							alert('Navigate to mappings')
						} else {
							props.onSelect(id)
						}
					}}
				/>
			}
		</div>
	)
}

interface DropdownItem {
	id: string
	label: string
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
				<div key={props.selectedItem.id} className="item">
					{props.selectedItem.label}
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
			if (!(e.target as any).closest('.other-items')) {
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
					className="item"
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
