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
								<div className="rundown-header-item datastore-action">
									<ScListItemLabel title={analogInputSetting.label} />

									<div className="triggers ">
										{analogInput?.value}

										{analogInput?.activeAnalog.identifier}
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
				// Assign the analog to this setting:
				analogInputSetting.fullIdentifier = activeAnalog.fullIdentifier
				ipcServer
					.updateProject({
						id: project.id,
						project,
					})
					.catch(handleError)

				setTriggersSubmenuPopover(null)
			})
		}
		return () => {
			listener?.stop()
		}
	}, [triggersSubmenuPopover])

	return (
		<>
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

			<div>
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
			<>
				<label>Use Absolute values&nbsp;&nbsp;</label>
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
			</>
			<div className="settings">
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
						<div>{`Wiggle any Analog Input to assign it!`}</div>
					</>
				)}
			</Popover>
		</>
	)
})
