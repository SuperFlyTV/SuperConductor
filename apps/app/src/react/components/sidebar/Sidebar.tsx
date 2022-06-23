import React from 'react'
import { SidebarResourceLibrary } from './SidebarResourceLibrary'

import { SideBarEditTimelineObject } from './SideBarEditTimelineObject'
import { Project } from '../../../models/project/Project'
import { store } from '../../mobx/store'
import { observer } from 'mobx-react-lite'
import { useMemoComputedObject, useMemoComputedValue } from '../../mobx/lib'
import { compact } from '@shared/lib'
import { TimelineObj } from '../../../models/rundown/TimelineObj'

export const Sidebar: React.FC<{ mappings: Project['mappings'] }> = observer(function Sidebar(props) {
	const currentRundownId = useMemoComputedValue(() => {
		return store.rundownsStore.currentRundownId
	}, [])

	const editing = useMemoComputedObject(
		() => {
			const selected = store.guiStore.selected
			const group =
				(currentRundownId &&
					selected.groupId &&
					store.rundownsStore.hasGroup(selected.groupId) &&
					store.rundownsStore.getGroup(selected.groupId)) ||
				null
			const part =
				(currentRundownId &&
					selected.groupId &&
					selected.partId &&
					store.rundownsStore.hasPart(selected.partId) &&
					store.rundownsStore.getPart(selected.partId)) ||
				null
			const timelineObjs =
				(currentRundownId &&
					selected.groupId &&
					selected.partId &&
					compact(
						selected.timelineObjIds.map(
							(objId) =>
								store.rundownsStore.hasTimelineObj(objId) && store.rundownsStore.getTimelineObj(objId)
						)
					)) ||
				[]

			if (group && part) {
				return {
					group,
					part,
					timelineObjs,
				}
			} else return null
		},
		[currentRundownId],
		true
	)

	if (!currentRundownId) {
		return null
	}
	let editTimelineObj: TimelineObj | undefined = undefined
	if (editing) {
		editTimelineObj = editing.timelineObjs[0]
	}

	if (editing && editTimelineObj) {
		// const descriptions = editing.timelineObjs.map((obj) => describeTimelineObject(obj.obj))
		const groupOrPartLocked = editing.group.locked || editing.part.locked

		return (
			<SideBarEditTimelineObject
				rundownId={currentRundownId}
				groupId={editing.group.id}
				partId={editing.part.id}
				timelineObj={editTimelineObj}
				mappings={props.mappings}
				disabled={groupOrPartLocked}
			/>

			// <div className="">
			// 	{editing.timelineObjs.map((obj, index) => {
			// 		return (
			// 			<div key={obj.obj.id}>
			// 				{resources[index] && <ResourceData resource={resources[index] as ResourceAny} />}

			// 			</div>
			// 		)
			// 	})}
			// </div>
		)
	} else {
		// not editing
		return <SidebarResourceLibrary />
	}
})
