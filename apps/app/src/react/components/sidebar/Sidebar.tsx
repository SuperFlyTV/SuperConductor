import React from 'react'
import { SidebarResourceLibrary } from './SidebarResourceLibrary.js'
import { SideBarEditTimelineObject } from './SideBarEditTimelineObject.js'
import { Project } from '../../../models/project/Project.js'
import { store } from '../../mobx/store.js'
import { observer } from 'mobx-react-lite'
import { useMemoComputedObject, useMemoComputedValue } from '../../mobx/lib.js'
import { assertNever } from '@shared/lib'
import { SideBarEditGroup } from './editGroup/SideBarEditGroup.js'
import { SideBarEditPart } from './editPart/SideBarEditPart.js'
import { ErrorBoundary } from '../util/ErrorBoundary.js'

export const Sidebar: React.FC<{ mappings: Project['mappings'] }> = observer(function Sidebar(props) {
	const currentRundownId = useMemoComputedValue(() => {
		return store.rundownsStore.currentRundownId
	}, [])

	const editing:
		| {
				type: 'group'
				items: {
					groupId: string
				}[]
		  }
		| {
				type: 'part'
				items: {
					groupId: string
					groupLocked: boolean
					partId: string
				}[]
		  }
		| {
				type: 'timelineObj'
				items: {
					groupId: string
					partId: string
					timelineObjId: string
					groupOrPartLocked?: boolean
				}[]
		  }
		| undefined = useMemoComputedObject(
		() => {
			const mainSelected = store.guiStore.mainSelected

			if (mainSelected && currentRundownId) {
				if (mainSelected.type === 'group') {
					return {
						type: 'group',
						items: store.guiStore
							.getSelectedOfType('group')
							.map((g) => {
								const group =
									store.rundownsStore.hasGroup(g.groupId) && store.rundownsStore.getGroup(g.groupId)
								if (group)
									return {
										groupId: group.id,
									}
							})
							.filter(Boolean),
					} as {
						type: 'group'
						items: {
							groupId: string
						}[]
					}
				} else if (mainSelected.type === 'part') {
					return {
						type: 'part',
						items: store.guiStore
							.getSelectedOfType('part')
							.map((p) => {
								const group =
									store.rundownsStore.hasGroup(p.groupId) && store.rundownsStore.getGroup(p.groupId)
								const part = store.rundownsStore.hasPart(p.partId)
								if (group && part)
									return {
										groupId: group.id,
										groupLocked: group.locked,
										partId: p.partId,
									}
							})
							.filter(Boolean),
					} as {
						type: 'part'
						items: {
							groupId: string
							groupLocked: boolean
							partId: string
						}[]
					}
				} else if (mainSelected.type === 'timelineObj') {
					return {
						type: 'timelineObj',
						items: store.guiStore
							.getSelectedOfType('timelineObj')
							.map((obj) => {
								const group =
									store.rundownsStore.hasGroup(obj.groupId) &&
									store.rundownsStore.getGroup(obj.groupId)
								const part =
									store.rundownsStore.hasPart(obj.partId) && store.rundownsStore.getPart(obj.partId)
								const timelineObj = store.rundownsStore.hasTimelineObj(obj.timelineObjId)
								if (group && part && timelineObj) {
									return {
										groupId: group.id,
										partId: part.id,
										timelineObjId: obj.timelineObjId,
										groupOrPartLocked: group.locked || part.locked,
									}
								}
							})
							.filter(Boolean),
					} as {
						type: 'timelineObj'
						items: {
							groupId: string
							partId: string
							timelineObjId: string
							groupOrPartLocked?: boolean
						}[]
					}
				} else {
					assertNever(mainSelected)
				}
			}

			return undefined
		},
		[currentRundownId],
		true
	)

	if (!currentRundownId) {
		return null
	}
	if (!editing) {
		// Not editing
		return (
			<ErrorBoundary>
				<SidebarResourceLibrary />
			</ErrorBoundary>
		)
	} else if (editing.type === 'group') {
		return (
			<ErrorBoundary>
				<SideBarEditGroup rundownId={currentRundownId} groups={editing.items} />
			</ErrorBoundary>
		)
	} else if (editing.type === 'part') {
		return (
			<ErrorBoundary>
				<SideBarEditPart rundownId={currentRundownId} parts={editing.items} />
			</ErrorBoundary>
		)
	} else if (editing.type === 'timelineObj') {
		return (
			<ErrorBoundary>
				<SideBarEditTimelineObject
					rundownId={currentRundownId}
					timelineObjs={editing.items}
					mappings={props.mappings}
				/>
			</ErrorBoundary>
		)
	} else {
		assertNever(editing)
		return null
	}
})
