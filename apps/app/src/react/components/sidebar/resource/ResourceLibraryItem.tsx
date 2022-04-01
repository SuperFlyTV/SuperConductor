import React, { useCallback } from 'react'
import classNames from 'classnames'
import { ResourceAny } from '@shared/models'
import { useDrag } from 'react-dnd'
import { DragItemTypes, ResourceDragItem } from '../../../api/DragItemTypes'
import { describeResource } from '@shared/lib'

type IProps = React.PropsWithChildren<{
	resource: ResourceAny
	selected: boolean
	onSelect?: (resource: ResourceAny) => void
}>

export const ResourceLibraryItem = function ResourceLibraryItem({ resource, selected, onSelect, children }: IProps) {
	const [{ dragged }, dragRef] = useDrag(
		() => ({
			type: DragItemTypes.RESOURCE_ITEM,
			item: (): ResourceDragItem => {
				return { type: DragItemTypes.RESOURCE_ITEM, resource }
			},
			collect: (monitor) => ({
				dragged: monitor.isDragging() ? true : false,
			}),
		}),
		[]
	)

	const resourceType = describeResource(resource)

	const clickHandler = useCallback(() => onSelect && onSelect(resource), [onSelect, resource])

	return (
		<div
			ref={dragRef}
			key={resource.id}
			className={classNames('resource', resourceType, {
				selected,
				dragged,
			})}
			onClick={clickHandler}
		>
			{children}
		</div>
	)
}
