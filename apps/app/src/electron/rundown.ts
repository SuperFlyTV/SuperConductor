import { Resolver } from 'superfly-timeline'
import { getPartLabel, getResolvedTimelineTotalDuration } from '../lib/util'
import { Part } from '../models/rundown/Part'
import { TimelineObjResolvedInstance } from '../models/rundown/TimelineObj'

export function postProcessPart(part: Part, noModify?: boolean): void {
	const resolvedTimeline = Resolver.resolveTimeline(
		part.timeline.map((o) => o.obj),
		{ time: 0 }
	)
	let modified = false

	for (const o of part.timeline) {
		const resolvedObj = resolvedTimeline.objects[o.obj.id]
		if (resolvedObj) {
			if (resolvedObj.resolved.instances.length === 0 && !noModify) {
				// If the timeline object has no instances, this might be because there's something wrong with the timelineObject.
				if (!Array.isArray(o.obj.enable)) {
					if (o.obj.enable.while === undefined) {
						if (typeof o.obj.enable.start === 'string') {
							o.obj.enable.start = 0 // Fall back to a default value
							modified = true
						}
						if (typeof o.obj.enable.duration === 'string') {
							o.obj.enable.duration = 1000 // Fall back to a default value
							modified = true
						}
						if (typeof o.obj.enable.end === 'string') {
							o.obj.enable.end = 1000 // Fall back to a default value
							modified = true
						}
					}
				}
			}

			o.resolved = {
				instances: resolvedObj.resolved.instances.map<TimelineObjResolvedInstance>((i) => ({
					start: i.start,
					end: i.end,
				})),
			}
		} else {
			o.resolved = {
				instances: [],
			}
		}
	}
	const maxDuration = getResolvedTimelineTotalDuration(resolvedTimeline, false)

	part.resolved = {
		duration: maxDuration,
		label: getPartLabel(part),
	}

	// If it was modified, run again to properly calculate artifacts:
	if (modified && !noModify) {
		postProcessPart(part, true)
	}
}
