import React from 'react'
import classNames from 'classnames'
import { ResourceAny } from '@/models/resource/resource'
import { useDrag } from 'react-dnd'
import { ItemTypes } from '@/react/api/ItemTypes'
import { describeResource } from '@/lib/Resources'

type IProps = React.PropsWithChildren<{ resource: ResourceAny; selected: boolean; onClick?: React.MouseEventHandler }>

export const ResourceLibraryItem = function ResourceLibraryItem({ resource, selected, onClick, children }: IProps) {
	const [{ dragged }, dragRef] = useDrag(
		() => ({
			type: ItemTypes.RESOURCE_ITEM,
			item: { resource },
			collect: (monitor) => ({
				dragged: monitor.isDragging() ? true : false,
			}),
		}),
		[]
	)

	const resourceType = describeResource(resource)

	return (
		<div
			ref={dragRef}
			key={resource.id}
			className={classNames('resource', resourceType, {
				selected,
				dragged,
			})}
			onClick={onClick}
		>
			{children}
		</div>
	)
}
