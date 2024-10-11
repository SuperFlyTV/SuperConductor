import { IPCServerContext } from '../../../contexts/IPCServer.js'
import React, { useCallback, useContext, useMemo, useState } from 'react'
import { TrashBtn } from '../../inputs/TrashBtn.js'
import { DataRow } from '../DataRow/DataRow.js'
import { SidebarContent } from '../SidebarContent.js'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler.js'
import { observer } from 'mobx-react-lite'
import { store } from '../../../mobx/store.js'
import { ConfirmationDialog } from '../../util/ConfirmationDialog.js'
import { computed } from 'mobx'
import { BooleanInput } from '../../inputs/BooleanInput.js'
import { SelectEnum } from '../../inputs/SelectEnum.js'
import { PlayoutMode, ScheduleSettings } from '../../../../models/rundown/Group.js'
import { DateTimeInput } from '../../inputs/DateTimeInput.js'
import { RepeatingType } from '../../../../lib/timeLib.js'
import { DurationInput } from '../../inputs/DurationInput.js'
import { ToggleInput } from '../../inputs/ToggleInput.js'
import { assertNever } from '@shared/lib'
import { PartialDeep } from 'type-fest'
import { IntInput } from '../../inputs/IntInput.js'
import { SelectEnumMultiple } from '../../inputs/SelectMultiple.js'
import { FormLabel, Grid } from '@mui/material'
import { shortID } from '../../../../lib/util.js'
import {
	allAreTrue,
	firstValue,
	getListBoolean,
	getListBooleanLabels,
	isIndeterminate,
	ListBoolean,
	inputValue,
} from '../../../lib/multipleEdit.js'

export const SideBarEditGroup: React.FC<{
	rundownId: string
	groups: {
		groupId: string
	}[]
}> = observer(function SideBarEditGroup({ rundownId, groups }) {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)

	/**
	 * A list of all selected groups.
	 * Guaranteed to have at least 1 entry.
	 */
	const fullGroups = computed(() =>
		groups
			.filter((g) => store.rundownsStore.hasGroup(g.groupId))
			.map((g) => store.rundownsStore.getGroup(g.groupId))
	).get()

	const handleDelete = useCallback(
		(groupId: string) => {
			ipcServer
				.deleteGroup({
					rundownId,
					groupId,
				})
				.then(() => {
					store.guiStore.removeSelected({
						type: 'group',
						groupId,
					})
				})
				.catch(handleError)
		},
		[handleError, ipcServer, rundownId]
	)

	const toggleId = useMemo(() => `toggle_${shortID()}`, [])

	if (!fullGroups.length) return null // Ensure at least one entry

	const locked = getListBoolean(fullGroups, (g) => g.locked ?? false)
	const oneAtATime = getListBoolean(fullGroups, (g) => g.oneAtATime)

	/** List of which groups can be modified/deleted */
	const modifiableGroups = fullGroups.filter((g) => !g.locked)
	/** List of which mofidiable groups in OneAtATime mode */
	const modifiableGroupsOneAtATime = modifiableGroups.filter((g) => g.oneAtATime)

	const header = (
		<>
			<div className="title">
				<span>{fullGroups.length > 1 ? `${fullGroups.length} groups` : `Group: ${fullGroups[0].name}`}</span>
				<div>
					<TrashBtn
						disabled={modifiableGroups.length === 0}
						onClick={() => {
							setDeleteConfirmationOpen(true)
						}}
						title={
							modifiableGroups.length === 1 ? 'Delete Group' : `Delete ${modifiableGroups.length} Groups`
						}
					/>
				</div>
			</div>
		</>
	)

	return (
		<SidebarContent title={header} className="edit-group">
			<DataRow label="ID" value={fullGroups.length > 1 ? 'Different IDs' : fullGroups[0].id} />

			<div className="settings">
				<>
					<div className="setting">
						<SelectEnum
							label="Playout mode"
							{...inputValue(modifiableGroups, (g) => g.playoutMode, undefined)}
							disabled={modifiableGroups.length === 0}
							fullWidth
							options={PlayoutMode}
							onChange={(value) => {
								modifiableGroups.forEach((g) => {
									ipcServer
										.updateGroup({
											rundownId,
											groupId: g.id,
											group: { playoutMode: value },
										})
										.catch(handleError)
								})
							}}
						/>
					</div>
					{allAreTrue(fullGroups, (g) => g.playoutMode === PlayoutMode.SCHEDULE) && (
						<div className="settings-group">
							<div className="setting">
								<Grid container>
									<Grid item sx={{ mr: 1 }}>
										<ToggleInput
											id={toggleId}
											disabled={modifiableGroups.length === 0}
											onChange={(value) => {
												modifiableGroups.forEach((g) => {
													ipcServer
														.updateGroup({
															rundownId,
															groupId: g.id,
															group: { schedule: { activate: value } },
														})
														.catch(handleError)
												})
											}}
											{...inputValue(modifiableGroups, (g) => g.schedule.activate, undefined)}
											label={
												firstValue(modifiableGroups, (g) => g.schedule.activate)
													? 'Click to disable schedule'
													: 'Click to activate schedule'
											}
										/>
									</Grid>
									<Grid item>
										<FormLabel htmlFor={toggleId}>
											{getListBooleanLabels(fullGroups, (g) => !!g.schedule.activate, [
												'Schedule active',
												'-- Different values --',
												'Schedule disabled',
											])}
										</FormLabel>
									</Grid>
								</Grid>
							</div>
							<div className="setting">
								<DateTimeInput
									label="Start Time"
									{...inputValue(modifiableGroups, (g) => g.schedule.startTime, undefined)}
									allowUndefined={true}
									disabled={modifiableGroups.length === 0}
									fullWidth
									onChange={(value) => {
										modifiableGroups.forEach((g) => {
											ipcServer
												.updateGroup({
													rundownId,
													groupId: g.id,
													group: {
														schedule: {
															startTime: value,
														},
													},
												})
												.catch(handleError)
										})
									}}
								/>
							</div>
							<div className="setting">
								<SelectEnum
									label="Repeating"
									{...inputValue(modifiableGroups, (g) => g.schedule.repeating.type, undefined)}
									disabled={modifiableGroups.length === 0}
									fullWidth
									options={RepeatingType}
									onChange={(value) => {
										modifiableGroups.forEach((g) => {
											ipcServer
												.updateGroup({
													rundownId,
													groupId: g.id,
													group: {
														schedule: {
															repeating: {
																type: value,
															},
														},
													},
												})
												.catch(handleError)
										})
									}}
								/>
							</div>
							{isIndeterminate(modifiableGroups, (g) => g.schedule.repeating) ? (
								<div>-- Different schemas --</div>
							) : (
								<GroupScheduleRepeatingSettings
									repeating={firstValue(modifiableGroups, (g) => g.schedule.repeating)}
									disabled={modifiableGroups.length === 0}
									onChange={(repeatingUpdate) => {
										modifiableGroups.forEach((g) => {
											ipcServer
												.updateGroup({
													rundownId,
													groupId: g.id,
													group: {
														schedule: {
															repeating: repeatingUpdate,
														},
													},
												})
												.catch(handleError)
										})
									}}
								/>
							)}
						</div>
					)}
				</>

				<div className="setting">
					<BooleanInput
						label="Disable playout"
						{...inputValue(modifiableGroups, (g) => g.disabled, undefined)}
						disabled={locked === ListBoolean.ALL}
						onChange={(value) => {
							fullGroups
								.filter((g) => !g.locked)
								.forEach((g) => {
									ipcServer
										.toggleGroupDisable({
											rundownId,
											groupId: g.id,
											value,
										})
										.catch(handleError)
								})
						}}
					/>
				</div>
				<div className="setting">
					<BooleanInput
						label="Lock group for editing"
						currentValue={locked === ListBoolean.ALL}
						indeterminate={locked === ListBoolean.SOME}
						onChange={(value) => {
							fullGroups.forEach((g) => {
								ipcServer
									.toggleGroupLock({
										rundownId,
										groupId: g.id,
										value,
									})
									.catch(handleError)
							})
						}}
					/>
				</div>
				<div className="setting">
					<BooleanInput
						label="Play one Part at a time"
						currentValue={oneAtATime === ListBoolean.ALL}
						indeterminate={oneAtATime === ListBoolean.SOME}
						disabled={locked === ListBoolean.ALL}
						onChange={(value) => {
							fullGroups
								.filter((g) => !g.locked)
								.forEach((g) => {
									ipcServer
										.toggleGroupOneAtATime({
											rundownId,
											groupId: g.id,
											value,
										})
										.catch(handleError)
								})
						}}
					/>
				</div>
				{oneAtATime !== ListBoolean.NONE && (
					<div className="setting">
						<BooleanInput
							label="Loop"
							{...inputValue(modifiableGroupsOneAtATime, (g) => g.loop, undefined)}
							disabled={modifiableGroupsOneAtATime.length === 0}
							onChange={(value) => {
								modifiableGroupsOneAtATime.forEach((g) => {
									ipcServer
										.toggleGroupLoop({
											rundownId,
											groupId: g.id,
											value,
										})
										.catch(handleError)
								})
							}}
						/>
					</div>
				)}
				{oneAtATime !== ListBoolean.NONE && (
					<div className="setting">
						<BooleanInput
							label="Auto-step"
							{...inputValue(modifiableGroupsOneAtATime, (g) => g.autoPlay, undefined)}
							disabled={modifiableGroupsOneAtATime.length === 0}
							onChange={(value) => {
								modifiableGroupsOneAtATime.forEach((g) => {
									ipcServer
										.toggleGroupAutoplay({
											rundownId,
											groupId: g.id,
											value,
										})
										.catch(handleError)
								})
							}}
						/>
					</div>
				)}
			</div>

			<ConfirmationDialog
				open={deleteConfirmationOpen}
				title="Delete Group"
				acceptLabel="Delete"
				onAccepted={() => {
					modifiableGroups.forEach((g) => handleDelete(g.id))
					setDeleteConfirmationOpen(false)
				}}
				onDiscarded={() => {
					setDeleteConfirmationOpen(false)
				}}
			>
				<p>
					Are you sure you want to delete{' '}
					{modifiableGroups.length > 1 || modifiableGroups.length === 0 ? (
						`${modifiableGroups.length} groups`
					) : (
						<>&quot;{modifiableGroups[0].name}&quot;</>
					)}
					?
				</p>
			</ConfirmationDialog>
		</SidebarContent>
	)
})

export const GroupScheduleRepeatingSettings: React.FC<{
	repeating: ScheduleSettings['repeating'] | undefined
	disabled: boolean | undefined
	onChange: (settings: PartialDeep<ScheduleSettings['repeating']>) => void
}> = ({ repeating, disabled, onChange }) => {
	if (!repeating) return null
	if (repeating.type === RepeatingType.NO_REPEAT) {
		return null
	} else if (repeating.type === RepeatingType.CUSTOM) {
		return (
			<>
				<div className="setting">
					<DurationInput
						label="Interval"
						fullWidth
						currentValue={repeating.intervalCustom as number}
						allowUndefined={false}
						allowNull={false}
						disabled={disabled}
						defaultValue={1}
						onChange={(value) => onChange({ intervalCustom: value })}
					/>
				</div>
				<div className="setting">
					<DateTimeInput
						label="Repeat Until"
						fullWidth
						currentValue={repeating.repeatUntil}
						allowUndefined={true}
						disabled={disabled}
						onChange={(value) => onChange({ repeatUntil: value })}
					/>
				</div>
			</>
		)
	} else if (repeating.type === RepeatingType.DAILY) {
		return (
			<>
				<div className="setting">
					<IntInput
						label="Repeat every X day"
						fullWidth
						currentValue={repeating.interval ?? 1}
						allowUndefined={false}
						disabled={disabled}
						onChange={(value) => onChange({ interval: value })}
					/>
				</div>
				<div className="setting">
					<DateTimeInput
						label="Repeat Until"
						fullWidth
						currentValue={repeating.repeatUntil}
						allowUndefined={true}
						disabled={disabled}
						onChange={(value) => onChange({ repeatUntil: value })}
					/>
				</div>
			</>
		)
	} else if (repeating.type === RepeatingType.WEEKLY) {
		const weekdaysSelect: number[] = []
		for (let i = 0; i < (repeating.weekdays ?? []).length; i++) {
			if ((repeating.weekdays ?? [])[i]) weekdaysSelect.push(i)
		}
		return (
			<>
				<div className="setting">
					<SelectEnumMultiple
						label="Repeat on week-day"
						fullWidth
						currentValues={weekdaysSelect}
						allowUndefined={false}
						disabled={disabled}
						options={[
							{ value: 0, label: 'Sunday' },
							{ value: 1, label: 'Monday' },
							{ value: 2, label: 'Tueday' },
							{ value: 3, label: 'Wednesday' },
							{ value: 4, label: 'Thursday' },
							{ value: 5, label: 'Friday' },
							{ value: 6, label: 'Saturday' },
						]}
						onChange={(value: number[]) => {
							const weekdays: [boolean, boolean, boolean, boolean, boolean, boolean, boolean] = [
								value.includes(0),
								value.includes(1),
								value.includes(2),
								value.includes(3),
								value.includes(4),
								value.includes(5),
								value.includes(6),
							]
							onChange({ weekdays: weekdays })
						}}
					/>
				</div>
				<div className="setting">
					<DateTimeInput
						label="Repeat Until"
						fullWidth
						currentValue={repeating.repeatUntil}
						allowUndefined={true}
						disabled={disabled}
						onChange={(value) => onChange({ repeatUntil: value })}
					/>
				</div>
			</>
		)
	} else if (repeating.type === RepeatingType.MONTHLY) {
		return (
			<>
				<div className="setting">
					<IntInput
						label="Repeat every X month"
						fullWidth
						currentValue={repeating.interval ?? 1}
						allowUndefined={false}
						disabled={disabled}
						onChange={(value) => onChange({ interval: value })}
					/>
				</div>
				<div className="setting">
					<DateTimeInput
						label="Repeat Until"
						fullWidth
						currentValue={repeating.repeatUntil}
						allowUndefined={true}
						disabled={disabled}
						onChange={(value) => onChange({ repeatUntil: value })}
					/>
				</div>
			</>
		)
	} else {
		assertNever(repeating)
		return <></>
	}
}
