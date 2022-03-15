import React, { useContext, useEffect, useState } from 'react'
import { findGroup, findPart, findTimelineObj } from '../../../lib/util'
import { Group } from '../../../models/rundown/Group'
import { Part } from '../../../models/rundown/Part'
import { RundownContext } from '../../contexts/Rundown'
// import { GUIContext } from '../../contexts/GUI'
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
import { store } from '../../mobx/store'
import { observer } from 'mobx-react-lite'

export const Sidebar: React.FC<{ mappings: Project['mappings'] }> = observer((props) => {
	const resourcesContext = useContext(ResourcesContext)
	const rundown = useContext(RundownContext)
	// const { gui } = useContext(GUIContext)

	const gui2 = store.guiStore

	const [editing, setEditing] = useState<{
		group: Group
		part: Part
		timelineObjs: TimelineObj[]
	} | null>(null)
	const [resources, setResources] = useState<Array<ResourceAny | undefined>>([])

	useEffect(() => {
		if (gui2.selectedGroupId && gui2.selectedPartId && gui2.selectedTimelineObjIds.length > 0) {
			const group = findGroup(rundown, gui2.selectedGroupId)
			if (group) {
				const part = findPart(group, gui2.selectedPartId)
				if (part) {
					const timelineObjs = gui2.selectedTimelineObjIds
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
	}, [rundown, resourcesContext, gui2.selectedGroupId, gui2.selectedPartId, gui2.selectedTimelineObjIds])

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
		const groupOrPartLocked = editing.group.locked || editing.part.locked

		return (
			<div className="sidebar timeline-obj-sidebar">
				{editing.timelineObjs.map((obj, index) => {
					return (
						<div key={obj.obj.id}>
							<div className="title">{descriptions[index].label}</div>

							{resources[index] && <ResourceData resource={resources[index] as ResourceAny} />}

							<TimelineObjData
								rundownId={rundown.id}
								groupId={editing.group.id}
								partId={editing.part.id}
								timelineObj={obj}
								mappings={props.mappings}
								disabled={groupOrPartLocked}
							/>

							{(obj.obj.content as any)?.type === TimelineContentTypeCasparCg.TEMPLATE && (
								<TemplateData
									rundownId={rundown.id}
									groupId={editing.group.id}
									partId={editing.part.id}
									timelineObjId={obj.obj.id}
									templateData={JSON.parse((obj.obj.content as any)?.data)}
									disabled={groupOrPartLocked}
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
})
