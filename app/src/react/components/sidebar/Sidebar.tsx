import React, { useContext, useEffect, useState } from 'react'
import { findGroup, findPart, findTimelineObj } from '@/lib/util'
import { Group } from '@/models/rundown/Group'
import { Part } from '@/models/rundown/Part'
import { RundownContext } from '@/react/contexts/Rundown'
import { GUIContext } from '@/react/contexts/GUI'
import { TimelineObj } from '@/models/rundown/TimelineObj'
import { ResourcesContext } from '@/react/contexts/Resources'
import { ResourceAny } from '@/models/resource/resource'
import { describeTimelineObject } from '@/lib/TimelineObj'
import { ResourceInfo } from './ResourceInfo'
import { ResourceLibrary } from './ResourceLibrary'
import { EditTimelineObj } from './TimelineObj'

export const Sidebar: React.FC<{}> = (props) => {
	const resources = useContext(ResourcesContext)
	const rundown = useContext(RundownContext)
	const { gui } = useContext(GUIContext)

	const [editing, setEditing] = useState<{
		group: Group
		part: Part
		timelineObj: TimelineObj
	} | null>(null)
	const [resource, setResource] = useState<ResourceAny | null>(null)

	useEffect(() => {
		if (gui.selectedGroupId && gui.selectedPartId && gui.selectedTimelineObjId) {
			const group = findGroup(rundown, gui.selectedGroupId)
			if (group) {
				const part = findPart(group, gui.selectedPartId)
				if (part) {
					const timelineObj = findTimelineObj(part, gui.selectedTimelineObjId)
					if (timelineObj) {
						setEditing({ group, part, timelineObj })
						return
					}
				}
			}
		}
		// else:
		setEditing(null)
	}, [rundown, resources, gui.selectedGroupId, gui.selectedPartId, gui.selectedTimelineObjId])

	useEffect(() => {
		if (editing) {
			if (editing.timelineObj.resourceId) {
				const newResource = resources[editing.timelineObj.resourceId]
				if (newResource) {
					setResource(newResource)
					return
				}
			}
		}

		setResource(null)
	}, [editing])

	if (editing) {
		const description = editing ? describeTimelineObject(editing.timelineObj.obj) : undefined

		return (
			<>
				{<div className="title">{description?.label}</div>}

				{resource && <ResourceInfo resource={resource} />}
				{editing.timelineObj && <EditTimelineObj obj={editing.timelineObj.obj} />}

				{/* {<TimelineObjInfo timelineObj={editing.timelineObj} appMappings={props.appData.mappings} />} */}

				{/* {(editing.timelineObj.content as any)?.type === TimelineContentTypeCasparCg.TEMPLATE && (
					<TemplateData
						timelineObjId={editing.timelineObj.id}
						templateData={JSON.parse((editing.timelineObj.content as any)?.data)}
					/>
				)} */}
			</>
		)
	} else {
		// not editing
		return <ResourceLibrary />
	}
}
