import React, { useContext, useEffect, useState } from 'react'
import { findGroup, findPart, findTimelineObj } from '../../../lib/util'
import { Group } from '../../../models/rundown/Group'
import { Part } from '../../../models/rundown/Part'
import { RundownContext } from '../../contexts/Rundown'
import { GUIContext } from '../../contexts/GUI'
import { TimelineObj } from '../../../models/rundown/TimelineObj'
import { ResourcesContext } from '../../contexts/Resources'
import { ResourceAny } from '@shared/models'
import { describeTimelineObject } from '../../../lib/TimelineObj'
import { ResourceData } from './resource/ResourceData'
import { ResourceLibrary } from './resource/ResourceLibrary'
import { TemplateData } from './template/TemplateData'
import { TimelineObjData } from './timelineObj/TimelineObjData'
import { TimelineContentTypeCasparCg } from 'timeline-state-resolver-types'
import { Project } from '../../../models/project/Project'

export const Sidebar: React.FC<{ mappings: Project['mappings'] }> = (props) => {
	const resourcesContext = useContext(ResourcesContext)
	const rundown = useContext(RundownContext)
	const { gui } = useContext(GUIContext)

	const [editing, setEditing] = useState<{
		group: Group
		part: Part
		timelineObjs: TimelineObj[]
	} | null>(null)
	const [resources, setResources] = useState<Array<ResourceAny | undefined>>([])

	useEffect(() => {
		if (gui.selectedGroupId && gui.selectedPartId && gui.selectedTimelineObjIds.length > 0) {
			const group = findGroup(rundown, gui.selectedGroupId)
			if (group) {
				const part = findPart(group, gui.selectedPartId)
				if (part) {
					const timelineObjs = gui.selectedTimelineObjIds
						.map((objId) => findTimelineObj(part, objId))
						.filter((obj): obj is TimelineObj => {
							return Boolean(obj)
						})
					if (timelineObjs.length > 0) {
						setEditing({ group, part, timelineObjs })
						return
					}
				}
			}
		}
		// else:
		setEditing(null)
	}, [rundown, resourcesContext, gui.selectedGroupId, gui.selectedPartId, gui.selectedTimelineObjIds])

	useEffect(() => {
		if (editing) {
			if (editing.timelineObjs.length > 0) {
				const newResources = editing.timelineObjs.map((obj) => {
					if (obj.resourceId) {
						return resourcesContext[obj.resourceId]
					}
				})
				if (newResources.length > 0) {
					setResources(newResources)
					return
				}
			}
		}

		setResources([])
	}, [editing, resourcesContext])

	if (editing) {
		const descriptions = editing.timelineObjs.map((obj) => describeTimelineObject(obj.obj))

		return (
			<div className="sidebar timeline-obj-sidebar">
				{editing.timelineObjs.map((obj, index) => {
					return (
						<div key={obj.obj.id} className="edit-timeline-obj">
							<div className="title">{descriptions[index].label}</div>

							{resources[index] && <ResourceData resource={resources[index] as ResourceAny} />}

							<TimelineObjData
								rundownId={rundown.id}
								groupId={editing.group.id}
								partId={editing.part.id}
								timelineObj={obj}
								mappings={props.mappings}
							/>

							{(obj.obj.content as any)?.type === TimelineContentTypeCasparCg.TEMPLATE && (
								<TemplateData
									rundownId={rundown.id}
									groupId={editing.group.id}
									partId={editing.part.id}
									timelineObjId={obj.obj.id}
									templateData={JSON.parse((obj.obj.content as any)?.data)}
								/>
							)}
						</div>
					)
				})}
			</div>
		)
	} else {
		// not editing
		return <ResourceLibrary />
	}
}
