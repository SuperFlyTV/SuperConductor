import React, { useContext, useRef, useState, useEffect, useCallback } from 'react'
import sorensen from '@sofie-automation/sorensen'
import { store } from '../../../../mobx/store'
import { allowMovingPartIntoGroup, MoveTarget } from '../../../../../lib/util'
import { Group } from '../../../../../models/rundown/Group'
import classNames from 'classnames'
import { IPCServerContext } from '../../../../contexts/IPCServer'
import { DropTargetMonitor, useDrag, useDrop, XYCoord } from 'react-dnd'
import { DragItemTypes, isPartDragItem, PartDragItem } from '../../../../api/DragItemTypes'
import { MdOutlineDragIndicator, MdMoreHoriz } from 'react-icons/md'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler'
import { observer } from 'mobx-react-lite'
import { computed } from 'mobx'
import { useMemoComputedObject } from '../../../../mobx/lib'
import VisibilitySensor from 'react-visibility-sensor'
import { ConfirmationDialog } from '../../../util/ConfirmationDialog'
import { TrashBtn } from '../../../inputs/TrashBtn'
import { DuplicateBtn } from '../../../inputs/DuplicateBtn'
import { sortSelected } from '../../../../lib/clientUtil'
import { Popover } from '@mui/material'
import { PartSubmenu } from './lib/PartSubmenu'

export const PartViewWrap: React.FC<{
	children: React.ReactElement
	rundownId: string
	parentGroupId: string
	partId: string
	tabAdditionalClassNames: { [key: string]: boolean }
	onVisibilityChange: (isVisible: boolean) => void
	renderEverything: boolean
	partClassNames?: string[]
}> = observer(function PartViewWrap({
	children,
	rundownId,
	parentGroupId,
	partId,
	tabAdditionalClassNames,
	onVisibilityChange,
	renderEverything,
	partClassNames,
}) {
	const part = store.rundownsStore.getPart(partId)
	const { handleError } = useContext(ErrorHandlerContext)
	const [waitingForBackendUpdate, setWaitingForBackendUpdate] = useState(false)

	const selectable = true
	const isSelected = computed(() =>
		store.guiStore.isSelected({
			type: 'part',
			groupId: parentGroupId,
			partId: partId,
		})
	)

	/** Update selection when a Part has been clicked */
	const updateSelection = useCallback(
		function updateSelection(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
			if (!selectable) return
			const targetEl = event.target as HTMLElement

			if (
				targetEl.closest('.timeline-object') ||
				targetEl.closest('.layer-names-dropdown') ||
				targetEl.closest('button') ||
				targetEl.closest('input') ||
				targetEl.closest('.editable') ||
				targetEl.closest('.MuiModal-root') ||
				targetEl.closest('.layer__content')
			)
				return

			const pressed = sorensen.getPressedKeys()
			if (pressed.includes('ControlLeft') || pressed.includes('ControlRight')) {
				// Add this part to the selection:
				store.guiStore.toggleAddSelected({
					type: 'part',
					groupId: parentGroupId,
					partId: partId,
				})
			} else if (pressed.includes('ShiftLeft') || pressed.includes('ShiftRight')) {
				// Add all parts between the last selected and this one:
				const mainSelected = store.guiStore.mainSelected
				if (mainSelected && mainSelected.type === 'part') {
					const allPartIds: { partId: string; groupId: string }[] = []
					for (const group of store.rundownsStore.getRundownGroups(rundownId)) {
						for (const part of store.rundownsStore.getGroupParts(group.id)) {
							allPartIds.push({
								groupId: group.id,
								partId: part.id,
							})
						}
					}
					const mainIndex = allPartIds.findIndex((p) => p.partId === mainSelected.partId)
					const thisIndex = allPartIds.findIndex((p) => p.partId === partId)
					if (mainIndex === -1 || thisIndex === -1) return
					if (mainIndex < thisIndex) {
						for (let i = mainIndex + 1; i <= thisIndex; i++) {
							store.guiStore.addSelected({
								type: 'part',
								groupId: allPartIds[i].groupId,
								partId: allPartIds[i].partId,
							})
						}
					} else if (mainIndex > thisIndex) {
						for (let i = mainIndex - 1; i >= thisIndex; i--) {
							store.guiStore.addSelected({
								type: 'part',
								groupId: allPartIds[i].groupId,
								partId: allPartIds[i].partId,
							})
						}
					}
				}
			} else {
				store.guiStore.toggleSelected({
					type: 'part',
					groupId: parentGroupId,
					partId: partId,
				})
			}
		},
		[rundownId, parentGroupId, partId, selectable]
	)
	/**
	 * This useEffect hook is part of a solution to the problem of
	 * timelineObjs briefly flashing back to their original start position
	 * after the user releases their mouse button after performing a drag move.
	 *
	 * In other words: this solves a purely aesthetic problem.
	 */
	useEffect(() => {
		if (waitingForBackendUpdate) {
			// A move has completed and we're waiting for the backend to give us the updated timelineObjs.

			return () => {
				// The backend has updated us (we know because `part` now points to a new object)
				// and we can clear the partId of the `move` context so that we stop displaying
				// timelineObjs with a drag delta applied.
				//
				// This is where a move operation has truly completed, including the backend response.
				setWaitingForBackendUpdate(false)
				store.guiStore.updateTimelineObjMove({
					partId: null,
					moveId: undefined,
				})
			}
		}
	}, [waitingForBackendUpdate, part])

	// Drag n' Drop re-ordering:
	// Adapted from https://react-dnd.github.io/react-dnd/examples/sortable/simple
	const dragRef = useRef<HTMLDivElement>(null)
	const previewRef = useRef<HTMLDivElement>(null)
	const [{ handlerId }, drop] = useDrop(
		// Use case: Drag Parts over this Part, to insert the Parts above or below this Part
		{
			accept: DragItemTypes.PART_ITEM,
			collect(monitor) {
				return {
					handlerId: monitor.getHandlerId(),
				}
			},
			canDrop: (movedItem) => {
				if (!isPartDragItem(movedItem)) {
					return false
				}

				const parentGroup = store.rundownsStore.getGroupInCurrentRundown(parentGroupId) || null

				if (!parentGroup) {
					return false
				}

				for (const movePart of movedItem.parts) {
					if (!allowMovingPartIntoGroup(movePart.partId, movePart.fromGroup, parentGroup)) {
						return false
					}
				}

				return true
			},
			hover(movedItem, monitor: DropTargetMonitor) {
				if (!isPartDragItem(movedItem)) {
					return
				}

				if (!previewRef.current) {
					return
				}

				const parentGroup = store.rundownsStore.getGroupInCurrentRundown(parentGroupId) || null
				let hoverGroup: Group | null = parentGroup
				const hoverPartId = part.id

				if (parentGroup === null || hoverGroup === null) {
					return
				}

				// Don't replace items with themselves
				if (movedItem.parts.find((p) => p.partId === hoverPartId)) {
					return
				}

				for (const movePart of movedItem.parts) {
					if (!allowMovingPartIntoGroup(movePart.partId, movePart.fromGroup, parentGroup)) {
						return false
					}
				}

				// Determine rectangle on screen
				const hoverBoundingRect = previewRef.current?.getBoundingClientRect()

				// Get vertical middle
				const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2

				// Determine mouse position
				const clientOffset = monitor.getClientOffset()

				// Get pixels to the top
				const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top

				let target: MoveTarget
				if (hoverGroup.transparent) {
					// Handle transparent group moves:
					if (hoverClientY < hoverMiddleY) {
						target = {
							type: 'before',
							id: hoverGroup.id,
						}
					} else {
						target = {
							type: 'after',
							id: hoverGroup.id,
						}
					}
					hoverGroup = null
				} else {
					if (hoverClientY < hoverMiddleY) {
						target = {
							type: 'before',
							id: part.id,
						}
					} else {
						target = {
							type: 'after',
							id: part.id,
						}
					}
				}

				// Time to actually perform the action
				store.rundownsStore.movePartsInCurrentRundown(
					movedItem.parts.map((p) => p.partId),
					hoverGroup?.id ?? null,
					target
				)

				// Note: we're mutating the monitor item here!
				// Generally it's better to avoid mutations,
				// but it's good here for the sake of performance
				// to avoid expensive index searches.
				movedItem.toGroupId = hoverGroup?.id ?? null
				movedItem.target = target
			},
		},
		[parentGroupId, part.id]
	)
	const [{ isDragging }, drag, preview] = useDrag(
		{
			type: DragItemTypes.PART_ITEM,
			item: (): PartDragItem | null => {
				const parentGroup = store.rundownsStore.getGroupInCurrentRundown(parentGroupId)

				if (!parentGroup) {
					return null
				}

				// If this Part isn't included in the current selection, select it:
				if (
					!store.guiStore.isSelected({
						type: 'part',
						groupId: parentGroup.id,
						partId: part.id,
					})
				) {
					store.guiStore.setSelected({
						type: 'part',
						groupId: parentGroup.id,
						partId: part.id,
					})
				}

				const selectedParts = sortSelected(
					rundownId,
					store.rundownsStore,
					store.guiStore.getSelectedOfType('part')
				)
				return {
					type: DragItemTypes.PART_ITEM,
					parts: selectedParts.map((selectedPart) => {
						return {
							partId: selectedPart.partId,
							fromGroup: store.rundownsStore.getGroup(selectedPart.groupId),
						}
					}),

					toGroupId: parentGroupId,
					target: null,
				}
			},
			collect: (monitor) => ({
				isDragging: monitor.isDragging(),
			}),
			isDragging: (monitor) => {
				return !!monitor.getItem().parts.find((p) => p.partId === part.id)
			},
			end: () => {
				store.rundownsStore.commitMovePartInCurrentRundown()?.catch(handleError)
			},
		},
		[part.id, parentGroupId]
	)

	useEffect(() => {
		drag(dragRef)
	}, [drag])

	useEffect(() => {
		drop(preview(previewRef))
	}, [drop, preview])

	const groupDisabled =
		computed(() => store.rundownsStore.getGroupInCurrentRundown(parentGroupId)?.disabled).get() || false
	const groupLocked =
		computed(() => store.rundownsStore.getGroupInCurrentRundown(parentGroupId)?.locked).get() || false
	const groupOrPartDisabled = groupDisabled || part.disabled

	const groupOrPartLocked = groupLocked || part.locked || false

	// Part Submenu
	const [partSubmenuPopoverAnchorEl, setPartSubmenuPopoverAnchorEl] = React.useState<SVGElement | null>(null)
	const closePartSubmenu = useCallback(() => {
		setPartSubmenuPopoverAnchorEl(null)
	}, [])
	const partSubmenuOpen = Boolean(partSubmenuPopoverAnchorEl)

	return (
		<VisibilitySensor onChange={onVisibilityChange} partialVisibility={true}>
			<div
				data-drop-handler-id={handlerId}
				data-part-id={part.id}
				ref={previewRef}
				className={classNames('part', partClassNames, {
					// active: isActive === 'active',
					// queued: isActive === 'queued',
					dragging: isDragging,
					disabled: groupOrPartDisabled,
					locked: groupOrPartLocked,
					selected: isSelected.get(),
					selectable: selectable,
				})}
				onClick={updateSelection}
			>
				<div className="part__selected" />
				<div className="part__dragArrow" />
				<div className={classNames('part__tab', tabAdditionalClassNames)}>
					<>
						<div ref={dragRef} className="part__drag-handle">
							{!groupOrPartLocked && <MdOutlineDragIndicator color="rgba(0, 0, 0, 0.5)" />}
						</div>

						{!groupLocked && (
							<div className="part__submenu-button">
								<MdMoreHoriz
									color="rgba(255, 255, 255, 0.5)"
									onClick={(event) => {
										setPartSubmenuPopoverAnchorEl(event.currentTarget)
									}}
								/>
							</div>
						)}
					</>
				</div>
				<>{children}</>

				<EndCap groupId={parentGroupId} partId={part.id} />

				<EndCapHover
					rundownId={rundownId}
					groupId={parentGroupId}
					partId={partId}
					partName={part.name}
					groupOrPartLocked={groupOrPartLocked}
					groupLocked={groupLocked}
				/>
				{renderEverything && (
					<>
						<Popover
							open={partSubmenuOpen}
							anchorEl={partSubmenuPopoverAnchorEl}
							onClose={closePartSubmenu}
							anchorOrigin={{
								vertical: 'bottom',
								horizontal: 'left',
							}}
						>
							<PartSubmenu
								rundownId={rundownId}
								groupId={parentGroupId}
								part={part}
								locked={groupOrPartLocked}
							/>
						</Popover>
					</>
				)}
			</div>
		</VisibilitySensor>
	)
})

const EndCap: React.FC<{
	groupId: string
	partId: string
}> = observer(function EndCap({ groupId, partId }) {
	const { groupIsPlaying, partIsPlaying, partIsPaused, partIsPlayNext } = useMemoComputedObject(() => {
		const playData = store.groupPlayDataStore.groups.get(groupId)

		if (!playData) {
			return {
				groupIsPlaying: false,
				partIsPlaying: false,
				partIsPaused: false,
				partIsPlayNext: false,
			}
		}
		const playhead = partId && playData.playheads[partId]
		return {
			groupIsPlaying: Boolean(playData.groupIsPlaying),
			partIsPlaying: Boolean(partId && partId in playData.playheads),
			partIsPaused: Boolean(playhead && playhead.partPauseTime !== undefined),
			partIsPlayNext: Boolean(
				playData.anyPartIsPlaying && playData.countdowns[partId] && playData.countdowns[partId].length > 0
			),
		}
	}, [groupId])

	return (
		<div
			className={classNames('part__endcap', {
				'group-playing': groupIsPlaying,
				'part-playing': partIsPlaying,
				'part-paused': partIsPaused,
				'part-play-next': partIsPlayNext,
			})}
		></div>
	)
})

const EndCapHover: React.FC<{
	rundownId: string
	groupId: string
	partId: string
	partName: string
	groupOrPartLocked: boolean
	groupLocked: boolean
}> = function EndCapHover({ rundownId, groupId, partId, groupOrPartLocked, groupLocked, partName }) {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
	const handleDelete = useCallback(() => {
		ipcServer.deletePart({ rundownId, groupId, partId }).catch(handleError)
	}, [groupId, handleError, ipcServer, partId, rundownId])

	const handleDuplicateBtn = useCallback(() => {
		ipcServer
			.duplicatePart({
				rundownId,
				groupId: groupId,
				partId: partId,
			})
			.catch(handleError)
	}, [groupId, handleError, ipcServer, partId, rundownId])

	return (
		<>
			<div className="end-cap-hover">
				<TrashBtn
					disabled={groupOrPartLocked}
					title={'Delete Part' + (groupOrPartLocked ? ' (disabled due to locked Part or Group)' : '')}
					onClick={() => {
						const pressedKeys = sorensen.getPressedKeys()
						if (pressedKeys.includes('ControlLeft') || pressedKeys.includes('ControlRight')) {
							// Delete immediately with no confirmation dialog.
							handleDelete()
						} else {
							setDeleteConfirmationOpen(true)
						}
					}}
				/>
				<DuplicateBtn title="Duplicate Part" disabled={groupLocked} onClick={handleDuplicateBtn} />
			</div>

			<ConfirmationDialog
				open={deleteConfirmationOpen}
				title="Delete Part"
				acceptLabel="Delete"
				onAccepted={() => {
					handleDelete()
					setDeleteConfirmationOpen(false)
				}}
				onDiscarded={() => {
					setDeleteConfirmationOpen(false)
				}}
			>
				<div>
					Are you sure you want to delete the part {partName}?
					<br />
					<br />
					(Tip: Hold CTRL when clicking the button to skip this dialog)`
				</div>
			</ConfirmationDialog>
		</>
	)
}
