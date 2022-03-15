import { IPCServerContext } from '../../../contexts/IPCServer'
import React, { useCallback, useContext, useState } from 'react'
import { Mappings } from 'timeline-state-resolver-types'
import { TimelineObj } from '../../../../models/rundown/TimelineObj'
import { TrashBtn } from '../../inputs/TrashBtn'
import { DataRow } from '../SidebarInfoGroup'
import { SidebarInfoGroup } from '../SidebarInfoGroup'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler'
import { observer } from 'mobx-react-lite'
import { store } from '../../../mobx/store'
import { EditTimelineObjContent } from './editTimelineObj'
import { describeTimelineObject } from '../../../../lib/TimelineObj'
import { ConfirmationDialog } from '../../util/ConfirmationDialog'

export const TimelineObjData: React.FC<{
	rundownId: string
	groupId: string
	partId: string
	timelineObj: TimelineObj
	mappings: Mappings | undefined
	disabled?: boolean
}> = observer((props) => {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)

	const gui = store.guiStore
	const description = describeTimelineObject(props.timelineObj.obj)

	const handleDelete = useCallback(() => {
		ipcServer
			.deleteTimelineObj({
				rundownId: props.rundownId,
				groupId: props.groupId,
				partId: props.partId,
				timelineObjId: props.timelineObj.obj.id,
			})
			.then(() => {
				gui.selectedTimelineObjIds = gui.selectedTimelineObjIds.filter((id) => id !== props.timelineObj.obj.id)
			})
			.catch(handleError)
	}, [gui, handleError, ipcServer, props.groupId, props.partId, props.rundownId, props.timelineObj.obj.id])

	return (
		<SidebarInfoGroup title="Timeline object">
			<DataRow label="ID" value={props.timelineObj.obj.id} />

			<EditTimelineObjContent
				obj={props.timelineObj.obj}
				onSave={(newObj) => {
					const editedTimelineObj = {
						...props.timelineObj,
						obj: newObj,
					}
					ipcServer
						.updateTimelineObj({
							rundownId: props.rundownId,
							groupId: props.groupId,
							partId: props.partId,
							timelineObjId: props.timelineObj.obj.id,
							timelineObj: editedTimelineObj,
						})
						.catch(handleError)
				}}
			/>

			<TrashBtn
				disabled={props.disabled}
				onClick={() => {
					setDeleteConfirmationOpen(true)
				}}
			/>

			<ConfirmationDialog
				open={deleteConfirmationOpen}
				title="Delete Timeline Object"
				body={`Are you sure you want to delete "${description.label}"?`}
				acceptLabel="Delete"
				onAccepted={() => {
					handleDelete()
					setDeleteConfirmationOpen(false)
				}}
				onDiscarded={() => {
					setDeleteConfirmationOpen(false)
				}}
			/>
		</SidebarInfoGroup>
	)
})
