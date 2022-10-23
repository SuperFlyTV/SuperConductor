import React, { useCallback, useContext, useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { store } from '../../../../mobx/store'

import { ProjectPageLayout } from '../projectPageLayout/ProjectPageLayout'
import { RoundedSection } from '../roundedSection/RoundedSection'
import { ScList } from '../scList/ScList'
import { ScListItemLabel } from '../scList/ScListItemLabel'

import './style.scss'
import { TextBtn } from '../../../inputs/textBtn/TextBtn'
import { shortID } from '../../../../../lib/util'
import { AnalogInputSetting, Project } from '../../../../../models/project/Project'
import { IPCServerContext } from '../../../../contexts/IPCServer'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler'
import { DurationInput } from '../../../inputs/DurationInput'
import { TextInput } from '../../../inputs/TextInput'
import { AnalogInput, AnalogInputs } from '../../../../../models/project/AnalogInput'
import { TriggerBtn } from '../../../inputs/TriggerBtn/TriggerBtn'
import { Popover } from '@mui/material'
import Toggle from 'react-toggle'
import { FloatInput } from '../../../inputs/FloatInput'
import { ActiveAnalog } from '../../../../../models/rundown/Analog'
import { clone } from 'lodash'
import { TrashBtn } from '../../../inputs/TrashBtn'
import { ConfirmationDialog } from '../../../util/ConfirmationDialog'

export const AnalogInputsPage: React.FC = observer(function AnalogInputsPage() {
	return (
		<ProjectPageLayout
			title="Analog References"
			help="Analog inputs are things like faders, knobs, jog wheels etc. The values from them can be used to modify properties of playing timeline-objects.
			How to use:
			(1) Connect a peripheral device, such as an X-keys or MIDI device (its settings are found in the Bridges page).
			(2) Click 'Add new Analog input' to set it up.
			(3) Go to the timeline-object you'd like to modify and click 'Add Analog input reference'.
			"
		>
			<AnalogInputs />
		</ProjectPageLayout>
	)
})

const AnalogInputs: React.FC = observer(function AnalogInputs() {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | undefined>()
	const [showDeleteConfirmationDialog, setShowDeleteConfirmationDialog] = useState<string | undefined>(undefined)

	const project = store.projectStore.project

	return (
		<>
			<RoundedSection title="Analog Inputs">
				<ScList
					list={Object.entries(project.analogInputSettings).map(([datastoreKey, analogInputSetting]) => {
						const analogInput = analogInputSetting.fullIdentifier
							? store.analogStore.getAnalogInput(analogInputSetting.fullIdentifier)
							: undefined
						return {
							id: datastoreKey,
							header: (
								<div className="analog-input-header-item">
									<ScListItemLabel title={analogInputSetting.label} />

									<div className="identifier">{analogInput?.activeAnalog.identifier}</div>

									{analogInput?.value !== undefined && (
										<div className="value">
											Value:
											<div className="content">{analogInput?.value}</div>
										</div>
									)}

									<div className="trash">
										<TrashBtn
											className="delete"
											title={'Delete'}
											onClick={() => {
												setShowDeleteConfirmationDialog(datastoreKey)
											}}
										/>
									</div>
								</div>
							),
							content: (
								<AnalogInputSettings
									project={project}
									datastoreKey={datastoreKey}
									analogInputSetting={analogInputSetting}
									analogInput={analogInput}
								/>
							),
						}
					})}
					openByDefault={newlyCreatedKey ? [newlyCreatedKey] : undefined}
				/>
				<div className="bottom-controls">
					<TextBtn
						label="Add new Analog input"
						onClick={() => {
							const defaultDatastoreAction: AnalogInputSetting = {
								label: 'New Analog input',
								fullIdentifier: null,
							}

							const datastoreKey = shortID()
							project.analogInputSettings[datastoreKey] = defaultDatastoreAction

							setNewlyCreatedKey(datastoreKey)

							ipcServer.updateProject({ id: project.id, project }).catch(handleError)
						}}
					/>
				</div>
			</RoundedSection>
			<ConfirmationDialog
				open={!!showDeleteConfirmationDialog}
				title="Delete"
				acceptLabel="Delete"
				onDiscarded={() => {
					setShowDeleteConfirmationDialog(undefined)
				}}
				onAccepted={() => {
					if (showDeleteConfirmationDialog) {
						delete project.analogInputSettings[showDeleteConfirmationDialog]
						ipcServer.updateProject({ id: project.id, project }).catch(handleError)
					}
					setShowDeleteConfirmationDialog(undefined)
				}}
			>
				<p>Do you want to delete {project.analogInputSettings[showDeleteConfirmationDialog ?? '']?.label}?</p>
			</ConfirmationDialog>
		</>
	)
})

const AnalogInputSettings: React.FC<{
	project: Project
	datastoreKey: string
	analogInputSetting: AnalogInputSetting
	analogInput: AnalogInput | undefined
}> = observer(function AnalogInputSettings({ project, datastoreKey, analogInputSetting, analogInput }) {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const [seenActiveAnalogs, setSeenActiveAnalogs] = React.useState<ActiveAnalog[]>([])

	// Triggers Submenu
	const [triggersSubmenuPopover, setTriggersSubmenuPopover] = React.useState<{
		anchor: HTMLButtonElement
	} | null>(null)
	const closeTriggersSubmenu = useCallback(() => {
		setTriggersSubmenuPopover(null)
	}, [])

	useEffect(() => {
		if (triggersSubmenuPopover) {
		}

		return () => {}
	}, [triggersSubmenuPopover])

	useEffect(() => {
		let listener:
			| {
					stop: () => void
			  }
			| undefined
		if (triggersSubmenuPopover) {
			listener = store.analogStore.listenToActiveAnalog((activeAnalog) => {
				setSeenActiveAnalogs((seen) => {
					seen = clone(seen)
					const existing = seen.find((v) => v.fullIdentifier === activeAnalog.fullIdentifier)
					if (existing) {
						existing.value = activeAnalog.value
					} else {
						seen.push(activeAnalog)
					}
					return seen
				})
			})
		}
		return () => {
			listener?.stop()
		}
	}, [triggersSubmenuPopover])

	return (
		<div className="analog-input-settings">
			<div className="main-settings">
				<TextInput
					currentValue={analogInputSetting.label}
					onChange={(v) => {
						analogInputSetting.label = v
						ipcServer
							.updateProject({
								id: project.id,
								project,
							})
							.catch(handleError)
					}}
					allowUndefined={false}
					label="Label"
				/>

				<div className="analog-input">
					<div className="trigger-button">
						<TriggerBtn
							onTrigger={(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
								setTriggersSubmenuPopover({
									anchor: event.currentTarget,
								})
							}}
							locked={false}
							triggerCount={analogInputSetting.fullIdentifier ? 1 : 0}
							anyGlobalTriggerFailed={false}
						/>
					</div>
					{analogInput && (
						<div className="raw-input">
							<label>Raw input:</label>

							<table>
								<tbody>
									<tr>
										<th>Identifier:</th>
										<td>{analogInput.activeAnalog.identifier}</td>
									</tr>
									<tr>
										<th>Absolute value:</th>
										<td>{analogInput.activeAnalog.value.absolute}</td>
									</tr>
									<tr>
										<th>Relative value:</th>
										<td>{analogInput.activeAnalog.value.relative}</td>
									</tr>
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>

			{analogInputSetting.fullIdentifier && (
				<div className="analog-settings">
					<div>
						<label>Use Absolute value&nbsp;&nbsp;</label>
						<div className="sc-switch">
							<Toggle
								checked={analogInputSetting.updateUsingAbsolute}
								onChange={() => {
									analogInputSetting.updateUsingAbsolute = !analogInputSetting.updateUsingAbsolute
									ipcServer
										.updateProject({
											id: project.id,
											project,
										})
										.catch(handleError)
								}}
							/>
						</div>
					</div>

					<FloatInput
						label="Scale factor"
						currentValue={analogInputSetting.scaleFactor}
						emptyPlaceholder={'1'}
						onChange={(v) => {
							analogInputSetting.scaleFactor = v
							ipcServer
								.updateProject({
									id: project.id,
									project,
								})
								.catch(handleError)
						}}
						allowUndefined={true}
					/>
					{analogInputSetting.updateUsingAbsolute && (
						<FloatInput
							label="Offset"
							currentValue={analogInputSetting.absoluteOffset}
							emptyPlaceholder={'0'}
							onChange={(v) => {
								analogInputSetting.absoluteOffset = v
								ipcServer
									.updateProject({
										id: project.id,
										project,
									})
									.catch(handleError)
							}}
							allowUndefined={true}
						/>
					)}
					{!analogInputSetting.updateUsingAbsolute && (
						<FloatInput
							label="Minimum cap value"
							currentValue={analogInputSetting.relativeMinCap}
							onChange={(v) => {
								analogInputSetting.relativeMinCap = v
								ipcServer
									.updateProject({
										id: project.id,
										project,
									})
									.catch(handleError)
							}}
							allowUndefined={true}
						/>
					)}
					{!analogInputSetting.updateUsingAbsolute && (
						<FloatInput
							label="Maximum cap value"
							currentValue={analogInputSetting.relativeMaxCap}
							onChange={(v) => {
								analogInputSetting.relativeMaxCap = v
								ipcServer
									.updateProject({
										id: project.id,
										project,
									})
									.catch(handleError)
							}}
							allowUndefined={true}
						/>
					)}
				</div>
			)}
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
					<>
						<div className="message">{`Now wiggle any Analog Input!`}</div>
						{seenActiveAnalogs.length > 0 && (
							<table className="active-analog-list">
								<tbody>
									<tr>
										<th>Identifier</th>
										<th>Absolute value</th>
										<th>Relative value</th>
									</tr>
									{seenActiveAnalogs.map((activeAnalog) => (
										<tr key={activeAnalog.fullIdentifier}>
											<td>{activeAnalog.identifier}</td>
											<td>{activeAnalog.value.absolute}</td>
											<td>{activeAnalog.value.relative}</td>
											<td>
												<TextBtn
													label={'Select this Analog Input'}
													onClick={() => {
														// Assign the analog to this setting:
														analogInputSetting.fullIdentifier = activeAnalog.fullIdentifier
														ipcServer
															.updateProject({
																id: project.id,
																project,
															})
															.catch(handleError)

														setTriggersSubmenuPopover(null)
													}}
												/>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</>
				)}
			</Popover>
		</div>
	)
})
