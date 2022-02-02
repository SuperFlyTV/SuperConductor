import React, { useCallback, useContext, useRef, useState } from 'react'
import { Field, Form, Formik } from 'formik'
import { GroupView } from './GroupView/GroupView'
import { RundownContext } from '../../contexts/Rundown'
import { IPCServerContext } from '../../contexts/IPCServer'
import { Rundown } from '../../../models/rundown/Rundown'
import { DropTargetMonitor, useDrop } from 'react-dnd'
import { DragItemTypes, PartDragItem } from '../../api/DragItemTypes'
import { MovePartFn } from './GroupView/PartView'
import { Group } from '../../../models/rundown/Group'
import { Part } from '../../../models/rundown/Part'
import { Mappings } from 'timeline-state-resolver-types'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import { TextField } from 'formik-mui'
import * as Yup from 'yup'

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
			accept: DragItemTypes.PART_ITEM,
			collect(monitor) {
				return {
					handlerId: monitor.getHandlerId(),
				}
			},
			async hover(item: PartDragItem, monitor: DropTargetMonitor) {
				const dragGroup = item.group
				const dragPart = item.part
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

const newPartValidationSchema = Yup.object({
	name: Yup.string().label('Part Name').required(),
})

const newGroupValidationSchema = Yup.object({
	name: Yup.string().label('Group Name').required(),
})

const GroupListOptions: React.FC<{ rundown: Rundown }> = ({ rundown }) => {
	const ipcServer = useContext(IPCServerContext)
	const [newPartOpen, setNewPartOpen] = useState(false)
	const [newGroupOpen, setNewGroupOpen] = useState(false)

	const handleNewPartClose = () => {
		setNewPartOpen(false)
	}

	const handleNewGroupClose = () => {
		setNewGroupOpen(false)
	}

	return (
		<>
			<div className="group-list__control-row">
				<Button className="btn" variant="contained" onClick={() => setNewPartOpen(true)}>
					New part
				</Button>
				<Button className="btn" variant="contained" onClick={() => setNewGroupOpen(true)}>
					New group
				</Button>
			</div>

			<Formik
				initialValues={{ name: '' }}
				validationSchema={newPartValidationSchema}
				enableReinitialize={true}
				onSubmit={(values, actions) => {
					ipcServer
						.newPart({
							rundownId: rundown.id,
							name: values.name,
							groupId: null,
						})
						.catch(console.error)
					setNewPartOpen(false)
					actions.setSubmitting(false)
					actions.resetForm()
				}}
			>
				{(formik) => (
					<Dialog open={newPartOpen} onClose={handleNewPartClose}>
						<DialogTitle>New Part</DialogTitle>
						<DialogContent>
							<Form>
								<Field
									component={TextField}
									margin="normal"
									fullWidth
									name="name"
									type="text"
									label="Part Name"
									autoFocus={true}
									required
								/>
							</Form>
						</DialogContent>
						<DialogActions>
							<Button
								onClick={() => {
									formik.submitForm().catch(console.error)
								}}
							>
								Create
							</Button>
							<Button onClick={handleNewPartClose}>Cancel</Button>
						</DialogActions>
					</Dialog>
				)}
			</Formik>

			<Formik
				initialValues={{ name: '' }}
				validationSchema={newGroupValidationSchema}
				enableReinitialize={true}
				onSubmit={(values, actions) => {
					ipcServer
						.newGroup({
							rundownId: rundown.id,
							name: values.name,
						})
						.catch(console.error)
					setNewGroupOpen(false)
					actions.setSubmitting(false)
					actions.resetForm()
				}}
			>
				{(formik) => (
					<Dialog open={newGroupOpen} onClose={handleNewGroupClose}>
						<DialogTitle>New Group</DialogTitle>
						<DialogContent>
							<Form>
								<Field
									component={TextField}
									margin="normal"
									fullWidth
									name="name"
									type="text"
									label="Group Name"
									autoFocus={true}
									required
								/>
							</Form>
						</DialogContent>
						<DialogActions>
							<Button
								onClick={() => {
									formik.submitForm().catch(console.error)
								}}
							>
								Create
							</Button>
							<Button onClick={handleNewGroupClose}>Cancel</Button>
						</DialogActions>
					</Dialog>
				)}
			</Formik>
		</>
	)
}
