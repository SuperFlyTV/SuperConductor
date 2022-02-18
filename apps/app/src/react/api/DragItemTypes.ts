import { ResourceAny } from '@shared/models'
import { Group } from '../../models/rundown/Group'

export enum DragItemTypes {
	RESOURCE_ITEM = 'resource_item',
	PART_ITEM = 'part_item',
}

export interface ResourceDragItem {
	type: DragItemTypes.RESOURCE_ITEM
	resource: ResourceAny
}

export interface PartDragItem {
	type: DragItemTypes.PART_ITEM
	partId: string
	fromGroup: Group
	/** null = make a new transparent group */
	toGroupId: string | null
	toGroupIndex: number
	toGroupTransparent: boolean
	/** The position in toGroup's parts array at which to place the dragged part */
	position: number
}

export type AnyDragItem = ResourceDragItem | PartDragItem

export function isDragItem(item: unknown): item is AnyDragItem {
	return typeof item === 'object' && item !== null && 'type' in item
}

export function isResourceDragItem(item: unknown): item is ResourceDragItem {
	return isDragItem(item) && item.type === DragItemTypes.RESOURCE_ITEM
}

export function isPartDragItem(item: unknown): item is PartDragItem {
	return isDragItem(item) && item.type === DragItemTypes.PART_ITEM
}
