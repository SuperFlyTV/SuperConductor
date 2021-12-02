import React from 'react'
import classNames from 'classnames'
import { ResourceAny } from '@/models/resource/resource'
import { useDrag } from 'react-dnd'
import { ItemTypes } from '@/react/api/ItemTypes'

type IProps = React.PropsWithChildren<{ resource: ResourceAny; selected: boolean; onClick?: React.MouseEventHandler }>

export const ResourecLibraryItem = function ResourecLibraryItem({ resource, selected, onClick, children }: IProps) {
	const [{ opacity }, dragRef] = useDrag(
		() => ({
			type: ItemTypes.RESOURCE_ITEM,
			item: { resource },
			collect: (monitor) => ({
				opacity: monitor.isDragging() ? 0.5 : 1,
			}),
		}),
		[]
	)

	return (
		<div
			ref={dragRef}
			key={resource.id}
			className={classNames('resource', 'resource-media', {
				selected,
			})}
			onClick={onClick}
			style={{ opacity }}
		>
			{children}
		</div>
	)
}
