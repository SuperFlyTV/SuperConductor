import { IPCServerContext } from '../../contexts/IPCServer'
import React, { useCallback, useContext, useState } from 'react'
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
import { anyAreTrue, firstValue, inputValue } from '../../lib/multipleEdit'
import { TextInput } from '../inputs/TextInput'
import { PartialDeep } from 'type-fest/source/partial-deep'
import { OnSave } from './timelineObj/timelineObjs/lib'
import { TimelineObj } from '../../../models/rundown/TimelineObj'
import { Tooltip } from '@mui/material'

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
	const [editCustomLabel, setEditCustomLabel] = useState(false)

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

	const modifiableObjects = fullObjs.filter((o) => !o.groupOrPartLocked)

	const onSave = useCallback(
		(update: PartialDeep<TimelineObj>) => {
			modifiableObjects.forEach((o) => {
				ipcServer
					.updateTimelineObj({
						rundownId: rundownId,
						groupId: o.groupId,
						partId: o.partId,
						timelineObjId: o.timelineObjId,
						timelineObj: update,
					})
					.catch(handleError)
			})
		},
		[modifiableObjects, handleError, ipcServer, rundownId]
	)
	const onSaveObj = useCallback<OnSave>(
		(updateObj) => {
			onSave({ obj: updateObj })
		},
		[onSave]
	)

	if (fullObjs.length === 0) return null

	let label = 'N/A'
	let hasCustomLabel = false
	if (fullObjs.length === 1) {
		const description = firstValue(modifiableObjects, (o) => describeTimelineObject(o.timelineObj))
		if (description) label = description.label

		hasCustomLabel = anyAreTrue(modifiableObjects, (o) => Boolean(o.timelineObj.customLabel))
	} else {
		label = `${fullObjs.length} objects`
	}

	const header = (
		<>
			<div className="title">
				<span>
					{fullObjs.length > 1 ? (
						`${fullObjs.length} Timeline objects`
					) : (
						<Tooltip title={`Click to set a custom label`}>
							<a
								onClick={(e) => {
									e.preventDefault()
									setEditCustomLabel(true)
								}}
							>
								Timeline object: $
								{firstValue(fullObjs, (o) => describeTimelineObject(o.timelineObj)?.label) || ''}
							</a>
						</Tooltip>
					)}
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

			{(editCustomLabel || hasCustomLabel) && (
				<div className="setting">
					<TextInput
						label="Custom label"
						fullWidth
						{...inputValue(modifiableObjects, (o) => o.timelineObj.customLabel, undefined)}
						onChange={(v) => {
							onSave({ customLabel: (v ?? '').trim() })
						}}
						allowUndefined={true}
					/>
				</div>
			)}

			<EditTimelineObjContent modifiableObjects={modifiableObjects} onSave={onSaveObj} />

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
