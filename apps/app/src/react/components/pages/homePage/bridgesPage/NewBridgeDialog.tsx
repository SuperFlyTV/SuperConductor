import React, { useCallback, useContext } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import { Bridge as BridgeType } from '../../../../../models/project/Bridge.js'
import { literal } from '@shared/lib'
import { ProjectContext } from '../../../../contexts/Project.js'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler.js'
import { Field, Form, Formik } from 'formik'
import { TextField } from 'formik-mui'
import * as Yup from 'yup'
import { IPCServerContext } from '../../../../contexts/IPCServer.js'
import { protectString, unprotectString } from '@shared/models'
import { BridgeId } from '@shared/api'

export const NewBridgeDialog: React.FC<{
	open: boolean
	onClose: () => void
}> = (props) => {
	const ipcServer = useContext(IPCServerContext)
	const project = useContext(ProjectContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const addBridge = useCallback(
		(name: string, url: string) => {
			const numBridges = Object.keys(project.bridges).length
			const newBridge = literal<BridgeType>({
				id: protectString<BridgeId>(`bridge${numBridges}`),
				name: name,
				outgoing: true,
				url: url,
				settings: {
					devices: {},
					peripherals: {},
					autoConnectToAllPeripherals: true,
				},
				clientSidePeripheralSettings: {},
			})

			project.bridges[unprotectString<BridgeId>(newBridge.id)] = newBridge
			ipcServer.updateProject({ id: project.id, project }).catch(handleError)

			props.onClose()
		},
		[props, handleError, ipcServer, project]
	)

	return (
		<Formik
			initialValues={{ name: '', url: 'ws://127.0.0.1:5401' }}
			validationSchema={Yup.object({
				name: Yup.string().label('Rundown Name').required(),
			})}
			enableReinitialize={true}
			onSubmit={(values, actions) => {
				addBridge(values.name, values.url)
				actions.setSubmitting(false)
				actions.resetForm()
			}}
		>
			{(formik) => {
				return (
					<Dialog open={props.open} onClose={props.onClose}>
						<DialogTitle>Add New Bridge</DialogTitle>
						<DialogContent>
							<Form>
								<Field
									component={TextField}
									margin="normal"
									fullWidth
									name="name"
									type="text"
									label="Bridge Name"
									autoFocus
									required
								/>
								<Field
									component={TextField}
									margin="normal"
									fullWidth
									name="url"
									type="text"
									label="URL"
									required
								/>
							</Form>
						</DialogContent>
						<DialogActions>
							<Button variant="contained" onClick={props.onClose}>
								Cancel
							</Button>
							<Button
								variant="contained"
								onClick={() => {
									formik.submitForm().catch(handleError)
								}}
							>
								Create
							</Button>
						</DialogActions>
					</Dialog>
				)
			}}
		</Formik>
	)
}
