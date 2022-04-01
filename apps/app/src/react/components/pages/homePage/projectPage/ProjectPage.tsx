import { observer } from 'mobx-react-lite'
import React, { useContext, useState } from 'react'
import { store } from '../../../../mobx/store'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
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

export const ProjectPage: React.FC<{ project: Project }> = observer((props) => {
	const serverAPI = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const rundownsStore = store.rundownsStore
	const guiStore = store.guiStore

	const [renameProjectOpen, setRenameProjectOpen] = useState(false)

	const handleReopen = (rundownId: string) => {
		serverAPI.openRundown({ rundownId }).catch(handleError)
		guiStore.activeTabId = rundownId
	}

	const handleRenameRundownClose = () => {
		setRenameProjectOpen(false)
	}

	return (
		<ProjectPageLayout
			title={props.project.name}
			subtitle="Project"
			controls={<TextBtn label="Rename" onClick={() => setRenameProjectOpen(true)} />}
		>
			<RoundedSection title="Rundown archive">
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
											onClick={() => handleReopen(closedRundown.rundownId)}
										/>
									</div>
								</div>
							),
						}
					})}
				/>
				{rundownsStore.closedRundowns.length < 1 && <div className="central">No rundowns in archive.</div>}
			</RoundedSection>

			<div className="rundowns-page"></div>

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
