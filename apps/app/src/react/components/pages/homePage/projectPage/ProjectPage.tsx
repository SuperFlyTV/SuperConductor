import { observer } from 'mobx-react-lite'
import React, { useCallback, useContext, useState } from 'react'
import { store } from '../../../../mobx/store.js'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import { IPCServerContext } from '../../../../contexts/IPCServer.js'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler.js'
import * as Yup from 'yup'
import { AiFillFolderOpen, AiOutlinePlusCircle } from 'react-icons/ai'
import { ProjectPageLayout } from '../projectPageLayout/ProjectPageLayout.js'
import { TextBtn } from '../../../inputs/textBtn/TextBtn.js'
import { Project } from '../../../../../models/project/Project.js'
import { Field, Form, Formik } from 'formik'
import { TextField } from 'formik-mui'
import { RoundedSection } from '../roundedSection/RoundedSection.js'
import { ScList } from '../scList/ScList.js'
import { ScListItemLabel } from '../scList/ScListItemLabel.js'

import './style.scss'
import { ConfirmationDialog } from '../../../util/ConfirmationDialog.js'

export const ProjectPage: React.FC<{ project: Project }> = observer(function ProjectPage(props) {
	const serverAPI = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const [renameProjectOpen, setRenameProjectOpen] = useState(false)
	const handleRenameRundownClose = () => {
		setRenameProjectOpen(false)
	}

	const [listProjectsOpen, setListProjectsOpen] = useState<{ name: string; id: string }[] | false>(false)
	const handleListProjectsClose = () => {
		setListProjectsOpen(false)
	}

	return (
		<ProjectPageLayout
			title={props.project.name}
			subtitle="Project"
			controls={
				<>
					<div className="section">
						<TextBtn label="Rename" onClick={() => setRenameProjectOpen(true)} />
					</div>
					<div className="section">
						<TextBtn
							label={
								<>
									<AiOutlinePlusCircle /> New project
								</>
							}
							onClick={() => {
								serverAPI.newProject().catch(handleError)
							}}
						/>
						<TextBtn
							label={
								<>
									<AiFillFolderOpen /> Open existing project
								</>
							}
							onClick={() => {
								serverAPI
									.listProjects()
									.then((projects) => {
										setListProjectsOpen(projects)
									})
									.catch(handleError)
							}}
						/>
					</div>
					<div className="section">
						<TextBtn
							label="Export to file"
							onClick={() => {
								serverAPI.exportProject().catch(handleError)
							}}
						/>
						<TextBtn
							label="Import from file"
							onClick={() => {
								serverAPI.importProject().catch(handleError)
							}}
						/>
					</div>
				</>
			}
		>
			<RundownArchive />

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

			{/* List Projects dialog */}
			<Formik
				initialValues={{ projectId: '' }}
				// validationSchema={Yup.object({
				// 	name: Yup.string().label('Project Name').required(),
				// })}
				enableReinitialize={true}
				onSubmit={(values, actions) => {
					serverAPI.openProject({ projectId: values.projectId }).catch(handleError)
					handleListProjectsClose()
					actions.setSubmitting(false)
					actions.resetForm()
				}}
			>
				{(formik) => {
					return (
						<Dialog open={listProjectsOpen !== false} onClose={handleListProjectsClose}>
							<DialogTitle>Open existing Project</DialogTitle>
							<DialogContent>
								<table>
									<tbody>
										{listProjectsOpen &&
											listProjectsOpen.map((project) => (
												<tr key={project.id}>
													<td>{project.name}</td>
													<td>
														<Button
															variant="contained"
															onClick={() => {
																formik.values.projectId = project.id
																formik.submitForm().catch(handleError)
															}}
														>
															Open
														</Button>
													</td>
												</tr>
											))}
									</tbody>
								</table>
							</DialogContent>
							<DialogActions>
								<Button variant="contained" onClick={handleListProjectsClose}>
									Cancel
								</Button>
							</DialogActions>
						</Dialog>
					)
				}}
			</Formik>
		</ProjectPageLayout>
	)
})

const RundownArchive: React.FC = observer(function RundownArchive() {
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

	const [deleteRundownConfirmationOpen, setDeleteRundownConfirmationOpen] = useState<string | false>(false)
	const handleDeleteRundown = useCallback(() => {
		if (deleteRundownConfirmationOpen) {
			serverAPI
				.deleteRundown({
					rundownId: deleteRundownConfirmationOpen,
				})
				.catch(handleError)
		}
	}, [handleError, serverAPI, deleteRundownConfirmationOpen])

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
										onClick={() => {
											setDeleteRundownConfirmationOpen(closedRundown.rundownId)
										}}
									/>
								</div>
							</div>
						),
					}
				})}
			/>
			{rundownsStore.closedRundowns.length < 1 && <div className="central">No rundowns in archive.</div>}
			<ConfirmationDialog
				open={!!deleteRundownConfirmationOpen}
				title="Delete Rundown"
				acceptLabel="Delete"
				onAccepted={() => {
					handleDeleteRundown()
					setDeleteRundownConfirmationOpen(false)
				}}
				onDiscarded={() => {
					setDeleteRundownConfirmationOpen(false)
				}}
			>
				<div>Are you sure you want to delete the Rundown?</div>
			</ConfirmationDialog>
		</RoundedSection>
	)
})
