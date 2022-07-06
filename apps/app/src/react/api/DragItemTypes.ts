import { ResourceAny } from '@shared/models'
import { MoveTarget } from '../../lib/util'
import { GroupGUI } from '../../models/rundown/Group'

export enum DragItemTypes {
	RESOURCE_ITEM = 'resource_item',
	PART_ITEM = 'part_item',
	GROUP_ITEM = 'group_item',
}

export interface ResourceDragItem {
	type: DragItemTypes.RESOURCE_ITEM
	resources: ResourceAny[]
}

export interface PartDragItem {
	type: DragItemTypes.PART_ITEM

	parts: {
		partId: string
		fromGroup: GroupGUI
	}[]

	/** null = make a new transparent group */
	toGroupId: string | null
	// toGroupIndex: number
	// toGroupTransparent: boolean
	target: MoveTarget | null
}

export interface GroupDragItem {
	type: DragItemTypes.GROUP_ITEM

	groupIds: string[]
	/** The position in the Rundown at which to place the dragged Group */
	target: MoveTarget | null
}

export type AnyDragItem = ResourceDragItem | PartDragItem | GroupDragItem

export function isDragItem(item: unknown): item is AnyDragItem {
	return typeof item === 'object' && item !== null && 'type' in item
}

export function isResourceDragItem(item: unknown): item is ResourceDragItem {
	return isDragItem(item) && item.type === DragItemTypes.RESOURCE_ITEM
}

export function isPartDragItem(item: unknown): item is PartDragItem {
	return isDragItem(item) && item.type === DragItemTypes.PART_ITEM
}

export function isGroupDragItem(item: unknown): item is GroupDragItem {
	return isDragItem(item) && item.type === DragItemTypes.GROUP_ITEM
}
