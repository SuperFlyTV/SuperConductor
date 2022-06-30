import { IPCServerContext } from '../../contexts/IPCServer'
import React, { useCallback, useContext, useState } from 'react'
import { Mappings } from 'timeline-state-resolver-types'
import { TimelineObj } from '../../../models/rundown/TimelineObj'
import { TrashBtn } from '../inputs/TrashBtn'
import { DataRow } from './DataRow/DataRow'
import { SidebarContent } from './SidebarContent'
import { ErrorHandlerContext } from '../../contexts/ErrorHandler'
import { observer } from 'mobx-react-lite'
import { store } from '../../mobx/store'
import { EditTimelineObjContent } from './timelineObj/editTimelineObj'
import { describeTimelineObject } from '../../../lib/TimelineObj'
import { ConfirmationDialog } from '../util/ConfirmationDialog'

export const SideBarEditTimelineObject: React.FC<{
	rundownId: string
	groupId: string
	partId: string
	timelineObj: TimelineObj
	mappings: Mappings | undefined
	disabled?: boolean
}> = observer(function SideBarEditTimelineObject(props) {
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
				gui.removeSelected({
					type: 'timelineObj',
					groupId: props.groupId,
					partId: props.partId,
					timelineObjId: props.timelineObj.obj.id,
				})
			})
			.catch(handleError)
	}, [gui, handleError, ipcServer, props.rundownId, props.timelineObj.obj.id, props.groupId, props.partId])

	const header = (
		<>
			<div className="title">
				<span>{`${describeTimelineObject(props.timelineObj.obj)?.label || 'Timeline Object'}`}</span>
				<div>
					<TrashBtn
						disabled={props.disabled}
						onClick={() => {
							setDeleteConfirmationOpen(true)
						}}
						title="Delete timeline object"
					/>
				</div>
			</div>
		</>
	)
	return (
		<SidebarContent title={header} className="edit-timeline-obj">
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

			<ConfirmationDialog
				open={deleteConfirmationOpen}
				title="Delete Timeline Object"
				acceptLabel="Delete"
				onAccepted={() => {
					handleDelete()
					setDeleteConfirmationOpen(false)
				}}
				onDiscarded={() => {
					setDeleteConfirmationOpen(false)
				}}
			>
				<p>Are you sure you want to delete &quot;{description.label}&quot;?</p>
			</ConfirmationDialog>
		</SidebarContent>
	)
})
