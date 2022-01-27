import { ResourceAny } from '@shared/models'
import { Group } from '../../models/rundown/Group'
import { Part } from '../../models/rundown/Part'

export enum DragItemTypes {
	RESOURCE_ITEM = 'resource_item',
	PART_ITEM = 'part_item',
}

export interface ResourceDragItem {
	type: DragItemTypes.RESOURCE_ITEM
	resource: ResourceAny
}

export interface PartDragItem {
	index: number
	type: DragItemTypes.PART_ITEM
	group: Group
	groupIndex: number
	part: Part
}
