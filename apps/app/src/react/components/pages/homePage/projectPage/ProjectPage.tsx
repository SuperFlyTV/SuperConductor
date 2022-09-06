import { observer } from 'mobx-react-lite'
import React, { useCallback, useContext, useState } from 'react'
import { store } from '../../../../mobx/store'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Popover } from '@mui/material'
import { IPCServerContext } from '../../../../contexts/IPCServer'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler'
import * as Yup from 'yup'

import { ProjectPageLayout } from '../projectPageLayout/ProjectPageLayout'
import { TextBtn } from '../../../inputs/textBtn/TextBtn'
import { Project } from '../../../../../models/project/Project'
import { Field, Form, Formik } from 'formik'
import { TextField } from 'formik-mui'
import { RoundedSection } from '../roundedSection/RoundedSection'
import { ScList } from '../scList/ScList'
import { ScListItemLabel } from '../scList/ScListItemLabel'

import './style.scss'
import { ProjectTrigger } from '../../../../../models/rundown/Trigger'
import { Message } from '../message/Message'
import { TriggerBtn } from '../../../inputs/TriggerBtn/TriggerBtn'
import {
	ProjectTriggersSubmenu,
	RundownTriggersSubmenu,
} from '../../../rundown/GroupView/part/TriggersSubmenu/TriggersSubmenu'

export const ProjectPage: React.FC<{ project: Project }> = observer(function ProjectPage(props) {
	const serverAPI = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const [renameProjectOpen, setRenameProjectOpen] = useState(false)

	const handleRenameRundownClose = () => {
		setRenameProjectOpen(false)
	}

	return (
		<ProjectPageLayout
			title={props.project.name}
			subtitle="Project"
			controls={<TextBtn label="Rename" onClick={() => setRenameProjectOpen(true)} />}
		>
			<RundownArchive project={props.project} />
			<ProjectActions project={props.project} />

			{/* Rename Project dialog */}
			<Formik
				initialValues={{ name: props.project.name }}
				validationSchema={Yup.object({
					name: Yup.string().label('Project Name').required(),
				})}
				enableReinitialize={true}
				onSubmit={(values, actions) => {
					const newName = values.name
					if (newName.trim().length <= 0) {
						return
					}

					props.project.name = newName
					serverAPI.updateProject({ id: props.project.id, project: props.project }).catch(handleError)

					handleRenameRundownClose()
					actions.setSubmitting(false)
					actions.resetForm()
				}}
			>
				{(formik) => {
					return (
						<Dialog open={renameProjectOpen} onClose={handleRenameRundownClose}>
							<DialogTitle>Rename Project</DialogTitle>
							<DialogContent>
								<Form>
									<Field
										component={TextField}
										margin="normal"
										fullWidth
										id="name"
										name="name"
										type="text"
										label="Project Name"
										autoFocus
										required
									/>
								</Form>
							</DialogContent>
							<DialogActions>
								<Button variant="contained" onClick={handleRenameRundownClose}>
									Cancel
								</Button>
								<Button
									variant="contained"
									onClick={() => {
										formik.submitForm().catch(handleError)
									}}
								>
									Rename
								</Button>
							</DialogActions>
						</Dialog>
					)
				}}
			</Formik>
		</ProjectPageLayout>
	)
})

const RundownArchive: React.FC<{ project: Project }> = observer(function RundownArchive(props) {
	const serverAPI = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const guiStore = store.guiStore
	const rundownsStore = store.rundownsStore

	const handleReopen = (rundownId: string) => {
		serverAPI
			.openRundown({ rundownId })
			.then(() => {
				store.rundownsStore.setCurrentRundown(rundownId)
			})
			.catch(handleError)
		guiStore.activeTabId = rundownId
	}

	return (
		<RoundedSection
			title="Rundown archive"
			help="When you close a Rundown Tab, the Rundown move into this list, to rest and sleep :)"
		>
			<ScList
				list={rundownsStore.closedRundowns.map((closedRundown) => {
					return {
						id: closedRundown.rundownId,
						header: (
							<div className="rundown-header-item">
								<ScListItemLabel title={closedRundown.name} />
								<div className="controls">
									<TextBtn label="Reopen" onClick={() => handleReopen(closedRundown.rundownId)} />
									<TextBtn
										label="Permanently delete"
										style="danger"
										onClick={() => alert('This feature is not implemented yet.')}
									/>
								</div>
							</div>
						),
					}
				})}
			/>
			{rundownsStore.closedRundowns.length < 1 && <div className="central">No rundowns in archive.</div>}
		</RoundedSection>
	)
})
const ProjectActions: React.FC<{ project: Project }> = observer(function ProjectActions({ project }) {
	const serverAPI = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const guiStore = store.guiStore
	const rundownsStore = store.rundownsStore

	const handleReopen = (rundownId: string) => {
		serverAPI
			.openRundown({ rundownId })
			.then(() => {
				store.rundownsStore.setCurrentRundown(rundownId)
			})
			.catch(handleError)
		guiStore.activeTabId = rundownId
	}

	const projectActions: {
		[Key in ProjectTrigger['action']]: {
			label: string
			triggers: ProjectTrigger[]
		}
	} = {
		stop: { triggers: [], label: 'Stop' },
		play: { triggers: [], label: 'Play' },
		playStop: { triggers: [], label: 'PlayStop' },
		pause: { triggers: [], label: 'Pause' },
		previous: { triggers: [], label: 'Previous' },
		next: { triggers: [], label: 'Next' },
		delete: { triggers: [], label: 'Delete' },
	}
	for (const [triggerAction0, triggers] of Object.entries(project.triggers)) {
		const triggerAction = triggerAction0 as ProjectTrigger['action']
		if (projectActions[triggerAction]) {
			projectActions[triggerAction].triggers = triggers
		}
	}

	// Triggers Submenu
	const [triggersSubmenuPopover, setTriggersSubmenuPopover] = React.useState<{
		anchor: HTMLButtonElement
		triggerAction: ProjectTrigger['action']
		triggers: ProjectTrigger[]
	} | null>(null)
	const closeTriggersSubmenu = useCallback(() => {
		setTriggersSubmenuPopover(null)
	}, [])
	// const handleTriggerBtn = useCallback((event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {}, [])

	return (
		<>
			<RoundedSection
				title="Actions"
				help='The Project Actions are executed in the context of the GUI. For example, a "Play" will play the currently selected
		Group(s) or Part(s).'
			>
				<ScList
					list={Object.entries(projectActions).map(([triggerAction, projectAction]) => {
						return {
							id: triggerAction,
							header: (
								<div className="rundown-header-item">
									<ScListItemLabel title={projectAction.label} />
									<div className="controls">
										<TriggerBtn
											onTrigger={(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
												setTriggersSubmenuPopover({
													anchor: event.currentTarget,
													triggerAction: triggerAction as ProjectTrigger['action'],
													triggers: projectAction.triggers,
												})
											}}
											title="Open Triggers Submenu"
											locked={false}
											triggerCount={projectAction.triggers.length}
										/>

										{/* <TextBtn label="Reopen" onClick={() => handleReopen(closedRundown.rundownId)} />
									<TextBtn
										label="Permanently delete"
										style="danger"
										onClick={() => alert('This feature is not implemented yet.')}
									/> */}
									</div>
								</div>
							),
						}
					})}
				/>
			</RoundedSection>
			<Popover
				open={!!triggersSubmenuPopover}
				anchorEl={triggersSubmenuPopover?.anchor}
				onClose={closeTriggersSubmenu}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'left',
				}}
			>
				{triggersSubmenuPopover && (
					<ProjectTriggersSubmenu
						triggerAction={triggersSubmenuPopover.triggerAction}
						triggers={project.triggers[triggersSubmenuPopover.triggerAction] ?? []}
						// project={props.project}
						// allActionsForPart={allActionsForPart}
					/>
				)}
			</Popover>
		</>
	)
})
