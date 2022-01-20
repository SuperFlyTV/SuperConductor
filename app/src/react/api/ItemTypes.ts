import { ResourceAny } from '@/models/resource/resource'
import { Group } from '@/models/rundown/Group'
import { Part } from '@/models/rundown/Part'

export enum ItemTypes {
	RESOURCE_ITEM = 'resource_item',
	PART_ITEM = 'part_item',
}

export interface ResourceItem {
	resource: ResourceAny
}

export interface PartDragItem {
	index: number
	type: ItemTypes.PART_ITEM
	group: Group
	groupIndex: number
	part: Part
}
