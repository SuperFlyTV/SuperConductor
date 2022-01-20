import React, { useCallback, useContext, useRef, useState } from 'react'
import { Popup } from '../popup/Popup'
import { ErrorMessage, Field, Form, Formik } from 'formik'
import { GroupView } from './GroupView/GroupView'
import { RundownContext } from '@/react/contexts/Rundown'
import { IPCServerContext } from '@/react/contexts/IPCServer'
import { Rundown } from '@/models/rundown/Rundown'
import { FormRow } from '../sidebar/InfoGroup'
import { DropTargetMonitor, useDrop } from 'react-dnd'
import { ItemTypes } from '../../api/ItemTypes'
import { MovePartFn, PartDragItem } from './GroupView/PartView'
import { Group } from '../../../models/rundown/Group'
import { Part } from '../../../models/rundown/Part'
import { Mappings } from 'timeline-state-resolver-types'

export const RundownView: React.FC<{ mappings: Mappings }> = ({ mappings }) => {
	const rundown = useContext(RundownContext)
	const ipcServer = useContext(IPCServerContext)

	// Drag n' Drop:
	const wrapperRef = useRef<HTMLDivElement>(null)
	const movePart: MovePartFn = useCallback(
		(data: { dragGroup: Group; dragPart: Part; hoverGroup: Group | null; hoverIndex: number }) => {
			return ipcServer.movePart({
				from: {
					rundownId: rundown.id,
					groupId: data.dragGroup.id,
					partId: data.dragPart.id,
				},
				to: {
					rundownId: rundown.id,
					groupId: data.hoverGroup?.id ?? null,
					position: data.hoverIndex,
				},
			})
		},
		[rundown.id]
	)
	const [{ handlerId }, drop] = useDrop(
		{
			accept: ItemTypes.PART_ITEM,
			collect(monitor) {
				return {
					handlerId: monitor.getHandlerId(),
				}
			},
			async hover(item: PartDragItem, monitor: DropTargetMonitor) {
				const dragGroup = item.group
				const dragPart = item.part
				const dragIndex = item.index
				const hoverIndex = rundown.groups.length
				const hoverGroup = null

				// Don't replace items with themselves
				if (dragGroup.transparent) {
					return
				}

				// Ignore nested hover targets
				if (!monitor.isOver({ shallow: true })) {
					return
				}

				// Time to actually perform the action
				const newGroup = await movePart({ dragGroup, dragPart, hoverGroup, hoverIndex })
				if (!newGroup) {
					// The backend rejected the move, so do nothing.
					return
				}

				// Note: we're mutating the monitor item here!
				// Generally it's better to avoid mutations,
				// but it's good here for the sake of performance
				// to avoid expensive index searches.
				item.index = hoverIndex
				item.group = newGroup
			},
		},
		[rundown.groups]
	)
	drop(wrapperRef)

	return (
		<div className="group-list" ref={wrapperRef} data-handler-id={handlerId}>
			{rundown.groups.map((group, index) => {
				return (
					<GroupView
						key={group.id}
						group={group}
						groupIndex={index}
						rundownId={rundown.id}
						mappings={mappings}
						movePart={movePart}
					/>
				)
			})}

			<GroupListOptions rundown={rundown} />
		</div>
	)
}

const GroupListOptions: React.FC<{ rundown: Rundown }> = ({ rundown }) => {
	const ipcServer = useContext(IPCServerContext)
	const [newPartOpen, setNewPartOpen] = useState(false)
	const [newGroupOpen, setNewGroupOpen] = useState(false)

	return (
		<>
			<div className="group-list__control-row">
				<button className="btn form" onClick={() => setNewPartOpen(true)}>
					New part
				</button>
				<button className="btn form" onClick={() => setNewGroupOpen(true)}>
					New group
				</button>
			</div>
			{newPartOpen && (
				<Popup onClose={() => setNewPartOpen(false)}>
					<Formik
						initialValues={{ name: '' }}
						enableReinitialize={true}
						onSubmit={(values, actions) => {
							ipcServer.newPart({
								rundownId: rundown.id,
								name: values.name,
								groupId: null,
							})
							setNewPartOpen(false)
						}}
					>
						{(formik) => (
							<Form>
								<FormRow>
									<label htmlFor="name">Name</label>
									<Field id="name" name="name" placeholder="Part name" autoFocus={true} />
									<ErrorMessage name="name" component="div" />
								</FormRow>
								<div className="btn-row-right">
									<button type="submit" className="btn form">
										Create
									</button>
								</div>
							</Form>
						)}
					</Formik>
				</Popup>
			)}

			{newGroupOpen && (
				<Popup onClose={() => setNewGroupOpen(false)}>
					<Formik
						initialValues={{ name: '' }}
						enableReinitialize={true}
						onSubmit={(values, _actions) => {
							ipcServer.newGroup({
								rundownId: rundown.id,
								name: values.name,
							})

							setNewGroupOpen(false)
						}}
					>
						{(formik) => (
							<Form>
								<FormRow>
									<label htmlFor="name">Name</label>
									<Field id="name" name="name" placeholder="Group name" autoFocus={true} />
									<ErrorMessage name="name" component="div" />
								</FormRow>
								<div className="btn-row-right">
									<button type="submit" className="btn form">
										Create
									</button>
								</div>
							</Form>
						)}
					</Formik>
				</Popup>
			)}
		</>
	)
}
