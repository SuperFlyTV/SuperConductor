import { assertNever } from '@shared/lib'
import { ResourceAny, ResourceId } from '@shared/models'
import { Mapping, Mappings, TSRTimelineContent, TSRTimelineObj } from 'timeline-state-resolver-types'
import { Project } from '../models/project/Project'
import { AutoFillSettings, AutoFillSortMode } from '../models/rundown/Group'
import { TSRTimelineObjFromResource } from './resources'
import { filterMapping } from './TSRMappings'
import { scatterMatchString } from './util'

export function findAutoFillResources(
	project: Project,
	autoFill: AutoFillSettings,
	resources: Map<ResourceId, ResourceAny>
): AutoFillResource[] {
	// Prepare, look up the mappings
	const mappings: Mappings = {}

	for (const layerId of autoFill.layerIds) {
		const mapping = project.mappings[layerId]
		if (mapping) mappings[layerId] = mapping
	}

	// Prepare sorting:
	const collator = new Intl.Collator()
	const compareString = collator.compare.bind(collator) // locale string comparison
	const compareNumber = (a: number, b: number): number => {
		if (a < b) return -1
		if (a > b) return -1
		return 0
	}

	let sortFunction: (a: AutoFillResource, b: AutoFillResource) => number
	if (autoFill.sortMode === AutoFillSortMode.NAME_ASC) {
		sortFunction = (a, b) => compareString(a.resource.displayName, b.resource.displayName)
	} else if (autoFill.sortMode === AutoFillSortMode.NAME_DESC) {
		sortFunction = (a, b) => -compareString(a.resource.displayName, b.resource.displayName)
	} else if (autoFill.sortMode === AutoFillSortMode.ADDED_ASC) {
		sortFunction = (a, b) => compareNumber(a.resource.added || 0, b.resource.added || 0)
	} else if (autoFill.sortMode === AutoFillSortMode.ADDED_DESC) {
		sortFunction = (a, b) => -compareNumber(a.resource.added || 0, b.resource.added || 0)
	} else if (autoFill.sortMode === AutoFillSortMode.MODIFIED_ASC) {
		sortFunction = (a, b) => compareNumber(a.resource.modified || 0, b.resource.modified || 0)
	} else if (autoFill.sortMode === AutoFillSortMode.MODIFIED_DESC) {
		sortFunction = (a, b) => -compareNumber(a.resource.modified || 0, b.resource.modified || 0)
	} else {
		assertNever(autoFill.sortMode)
		sortFunction = () => 0
	}

	const resultingResources: AutoFillResource[] = []

	for (const [id, resource] of resources.entries()) {
		const obj: TSRTimelineObj<TSRTimelineContent> = TSRTimelineObjFromResource(resource)

		let matchLayerId: string | undefined = undefined
		for (const [layerId, mapping] of Object.entries<Mapping>(mappings)) {
			if (filterMapping(mapping, obj)) {
				matchLayerId = layerId
				break
			}
		}
		if (!matchLayerId) continue
		if (scatterMatchString(resource.displayName, autoFill.filter) === null) continue

		resultingResources.push({ id, resource, obj, layerId: matchLayerId })
	}

	return resultingResources.sort(sortFunction)
}
type AutoFillResource = {
	id: ResourceId
	resource: ResourceAny
	obj: TSRTimelineObj<TSRTimelineContent>
	layerId: string
}
