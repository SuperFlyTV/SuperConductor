import { IPCServerContext } from '../../contexts/IPCServer'
import React, { useContext, useState } from 'react'
import { Mappings } from 'timeline-state-resolver-types'
import { TrashBtn } from '../inputs/TrashBtn'
import { DataRow } from './DataRow/DataRow'
import { SidebarContent } from './SidebarContent'
import { ErrorHandlerContext } from '../../contexts/ErrorHandler'
import { observer } from 'mobx-react-lite'
import { store } from '../../mobx/store'
import { EditTimelineObjContent } from './timelineObj/editTimelineObj'
import { describeTimelineObject } from '../../../lib/TimelineObj'
import { ConfirmationDialog } from '../util/ConfirmationDialog'
import { computed } from 'mobx'
import { firstValue } from '../../lib/multipleEdit'

export const SideBarEditTimelineObject: React.FC<{
	rundownId: string
	timelineObjs: {
		groupId: string
		partId: string
		timelineObjId: string
		groupOrPartLocked?: boolean
	}[]
	mappings: Mappings | undefined
}> = observer(function SideBarEditTimelineObject({ rundownId, timelineObjs }) {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)

	const gui = store.guiStore

	/**
	 * A list of all selected timeline objects.
	 * Guaranteed to have at least 1 entry
	 */
	const fullObjs = computed(() =>
		timelineObjs
			.filter((p) => store.rundownsStore.hasTimelineObj(p.timelineObjId))
			.map((p) => {
				return {
					...p,
					timelineObj: store.rundownsStore.getTimelineObj(p.timelineObjId),
				}
			})
	).get()

	if (fullObjs.length === 0) return null

	const modifiableObjects = fullObjs.filter((o) => !o.groupOrPartLocked)

	let label = 'N/A'
	if (fullObjs.length === 1) {
		const desciption = firstValue(modifiableObjects, (o) => describeTimelineObject(o.timelineObj.obj))
		if (desciption) label = desciption.label
	} else {
		label = `${fullObjs.length} objects`
	}

	const header = (
		<>
			<div className="title">
				<span>
					{fullObjs.length > 1
						? `${fullObjs.length} Timeline objects`
						: `Timeline object: ${
								firstValue(fullObjs, (o) => describeTimelineObject(o.timelineObj.obj)?.label) || ''
						  }`}
				</span>
				<div>
					<TrashBtn
						disabled={modifiableObjects.length === 0}
						onClick={() => {
							setDeleteConfirmationOpen(true)
						}}
						title={
							modifiableObjects.length === 1
								? 'Delete Timeline object'
								: `Delete ${modifiableObjects.length} Timeline object`
						}
					/>
				</div>
			</div>
		</>
	)
	return (
		<SidebarContent title={header} className="edit-timeline-obj">
			<DataRow label="ID" value={fullObjs.length > 1 ? 'Different IDs' : fullObjs[0].partId} />

			<EditTimelineObjContent
				modifiableObjects={modifiableObjects}
				onSave={(updateObj) => {
					modifiableObjects.forEach((o) => {
						ipcServer
							.updateTimelineObj({
								rundownId: rundownId,
								groupId: o.groupId,
								partId: o.partId,
								timelineObjId: o.timelineObjId,
								timelineObj: {
									obj: updateObj,
								},
							})
							.catch(handleError)
					})
				}}
			/>

			<ConfirmationDialog
				open={deleteConfirmationOpen}
				title={
					modifiableObjects.length === 1
						? 'Delete Timeline Object'
						: `Delete ${modifiableObjects.length} Timeline Objects`
				}
				acceptLabel="Delete"
				onAccepted={() => {
					modifiableObjects.forEach((o) => {
						ipcServer
							.deleteTimelineObj({
								rundownId: rundownId,
								groupId: o.groupId,
								partId: o.partId,
								timelineObjId: o.timelineObj.obj.id,
							})
							.then(() => {
								gui.removeSelected({
									type: 'timelineObj',
									groupId: o.groupId,
									partId: o.partId,
									timelineObjId: o.timelineObj.obj.id,
								})
							})
							.catch(handleError)
					})

					setDeleteConfirmationOpen(false)
				}}
				onDiscarded={() => {
					setDeleteConfirmationOpen(false)
				}}
			>
				<p>Are you sure you want to delete &quot;{label}&quot;?</p>
			</ConfirmationDialog>
		</SidebarContent>
	)
})
