import { IPCServerContext } from '../../../contexts/IPCServer'
import React, { useCallback, useContext, useMemo, useState } from 'react'
import { TrashBtn } from '../../inputs/TrashBtn'
import { DataRow } from '../DataRow/DataRow'
import { SidebarContent } from '../SidebarContent'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler'
import { observer } from 'mobx-react-lite'
import { store } from '../../../mobx/store'
import { ConfirmationDialog } from '../../util/ConfirmationDialog'
import { computed } from 'mobx'
import { BooleanInput } from '../../inputs/BooleanInput'
import { SelectEnum } from '../../inputs/SelectEnum'
import { Group, PlayoutMode, ScheduleSettings } from '../../../../models/rundown/Group'
import { DateTimeInput } from '../../inputs/DateTimeInput'
import { RepeatingType } from '../../../../lib/timeLib'
import { DurationInput } from '../../inputs/DurationInput'
import { assertNever } from '@shared/lib'
import { PartialDeep } from 'type-fest'
import { IntInput } from '../../inputs/IntInput'
import { SelectEnumMultiple } from '../../inputs/SelectMultiple'
import Toggle from 'react-toggle'
import { FormLabel, Grid } from '@mui/material'
import { shortID } from '../../../../lib/util'

type LockState = 'all' | 'some' | 'none'

export const SideBarEditGroup: React.FC<{
	rundownId: string
	groups: {
		groupId: string
	}[]
}> = observer(function SideBarEditGroup({ rundownId, groups }) {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)

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

	if (!fullGroups.length) return null

	let locked: LockState = 'none'
	if (fullGroups.every((g) => g.locked)) locked = 'all'
	else if (fullGroups.some((g) => g.locked)) locked = 'some'

	let oneAtATime: LockState = 'none'
	if (fullGroups.every((g) => g.oneAtATime)) oneAtATime = 'all'
	else if (fullGroups.some((g) => g.oneAtATime)) oneAtATime = 'some'

	const header = (
		<>
			<div className="title">
				<span>{fullGroups.length > 1 ? 'Multiple groups' : `Group: ${fullGroups[0].name}`}</span>
				<div>
					<TrashBtn
						disabled={fullGroups.every((g) => g.locked)}
						onClick={() => {
							setDeleteConfirmationOpen(true)
						}}
						title="Delete Group"
					/>
				</div>
			</div>
		</>
	)

	return (
		<SidebarContent title={header} className="edit-group">
			<DataRow label="ID" value={fullGroups.length > 1 ? 'Multiple IDs' : fullGroups[0].id} />

			<div className="settings">
				{fullGroups.length === 1 && (
					<>
						<div className="setting">
							<SelectEnum
								label="Playout mode"
								currentValue={fullGroups[0].playoutMode}
								disabled={locked === 'all'}
								fullWidth
								options={PlayoutMode}
								onChange={(value) => {
									ipcServer
										.updateGroup({
											rundownId,
											groupId: fullGroups[0].id,
											group: {
												playoutMode: value,
											},
										})
										.catch(handleError)
								}}
							/>
						</div>
						{fullGroups[0].playoutMode === PlayoutMode.SCHEDULE && (
							<div className="settings-group">
								<div className="setting">
									<Grid container>
										<Grid item sx={{ mr: 1 }}>
											<Toggle
												id={toggleId}
												onChange={(e) => {
													ipcServer
														.updateGroup({
															rundownId,
															groupId: fullGroups[0].id,
															group: { schedule: { activate: e.target.checked } },
														})
														.catch(handleError)
												}}
												checked={!!fullGroups[0].schedule.activate}
												title={
													fullGroups[0].schedule.activate
														? 'Click to disable schedule'
														: 'Click to activate schedule'
												}
											/>
										</Grid>
										<Grid item>
											<FormLabel htmlFor={toggleId}>
												{fullGroups[0].schedule.activate
													? 'Schedule active'
													: 'Schedule disabled'}
											</FormLabel>
										</Grid>
									</Grid>
								</div>
								<div className="setting">
									<DateTimeInput
										label="Start Time"
										currentValue={fullGroups[0].schedule.startTime}
										allowUndefined={true}
										disabled={locked === 'all'}
										fullWidth
										onChange={(value) => {
											ipcServer
												.updateGroup({
													rundownId,
													groupId: fullGroups[0].id,
													group: {
														schedule: {
															startTime: value,
														},
													},
												})
												.catch(handleError)
										}}
									/>
								</div>
								<div className="setting">
									<SelectEnum
										label="Repeating"
										currentValue={fullGroups[0].schedule.repeating.type}
										disabled={locked === 'all'}
										fullWidth
										options={RepeatingType}
										onChange={(value) => {
											ipcServer
												.updateGroup({
													rundownId,
													groupId: fullGroups[0].id,
													group: {
														schedule: {
															repeating: {
																type: value,
															},
														},
													},
												})
												.catch(handleError)
										}}
									/>
								</div>
								<GroupScheduleRepeatingSettings
									settings={fullGroups[0].schedule}
									locked={locked === 'all'}
									onChange={(groupUpdate) => {
										ipcServer
											.updateGroup({
												rundownId,
												groupId: fullGroups[0].id,
												group: groupUpdate,
											})
											.catch(handleError)
									}}
								/>
							</div>
						)}
					</>
				)}
				<div className="setting">
					<BooleanInput
						label="Disable playout"
						currentValue={fullGroups.every((g) => g.disabled)}
						indeterminate={fullGroups.some((g) => g.disabled !== fullGroups[0].disabled)}
						disabled={locked === 'all'}
						onChange={(value) => {
							fullGroups
								.filter((g) => !g.locked)
								.forEach((g) =>
									ipcServer
										.toggleGroupDisable({
											rundownId,
											groupId: g.id,
											value,
										})
										.catch(handleError)
								)
						}}
					/>
				</div>
				<div className="setting">
					<BooleanInput
						label="Lock group for editing"
						currentValue={locked === 'all'}
						indeterminate={locked === 'some'}
						onChange={(value) => {
							fullGroups.forEach((g) =>
								ipcServer
									.toggleGroupLock({
										rundownId,
										groupId: g.id,
										value,
									})
									.catch(handleError)
							)
						}}
					/>
				</div>
				<div className="setting">
					<BooleanInput
						label="Play one Part at a time"
						currentValue={oneAtATime === 'all'}
						indeterminate={oneAtATime === 'some'}
						disabled={locked === 'all'}
						onChange={(value) => {
							fullGroups
								.filter((g) => !g.locked)
								.forEach((g) =>
									ipcServer
										.toggleGroupOneAtATime({
											rundownId,
											groupId: g.id,
											value,
										})
										.catch(handleError)
								)
						}}
					/>
				</div>
				{oneAtATime !== 'none' && (
					<div className="setting">
						<BooleanInput
							label="Loop"
							currentValue={fullGroups.filter((g) => g.oneAtATime).every((g) => g.loop)}
							indeterminate={fullGroups
								.filter((g) => g.oneAtATime)
								.some((g, _i, all) => g.loop !== all[0].loop)}
							disabled={locked === 'all'}
							onChange={(value) => {
								fullGroups
									.filter((g) => !g.locked && g.oneAtATime)
									.forEach((g) =>
										ipcServer
											.toggleGroupLoop({
												rundownId,
												groupId: g.id,
												value,
											})
											.catch(handleError)
									)
							}}
						/>
					</div>
				)}
				{oneAtATime !== 'none' && (
					<div className="setting">
						<BooleanInput
							label="Auto-step"
							currentValue={fullGroups.filter((g) => g.oneAtATime).every((g) => g.autoPlay)}
							indeterminate={fullGroups
								.filter((g) => g.oneAtATime)
								.some((g, _i, all) => g.autoPlay !== all[0].autoPlay)}
							disabled={locked === 'all'}
							onChange={(value) => {
								fullGroups
									.filter((g) => !g.locked && g.oneAtATime)
									.forEach((g) =>
										ipcServer
											.toggleGroupAutoplay({
												rundownId,
												groupId: g.id,
												value,
											})
											.catch(handleError)
									)
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
					fullGroups.filter((g) => !g.locked).forEach((g) => handleDelete(g.id))
					setDeleteConfirmationOpen(false)
				}}
				onDiscarded={() => {
					setDeleteConfirmationOpen(false)
				}}
			>
				<p>
					Are you sure you want to delete{' '}
					{fullGroups.length > 1 ? 'multiple groups' : <>&quot;{fullGroups[0].name}&quot;</>}?
				</p>
			</ConfirmationDialog>
		</SidebarContent>
	)
})

export const GroupScheduleRepeatingSettings: React.FC<{
	settings: ScheduleSettings
	locked: boolean | undefined
	onChange: (group: PartialDeep<Group>) => void
}> = ({ settings, locked, onChange }) => {
	if (settings.repeating.type === RepeatingType.NO_REPEAT) {
		return null
	} else if (settings.repeating.type === RepeatingType.CUSTOM) {
		return (
			<>
				<div className="setting">
					<DurationInput
						label="Interval"
						fullWidth
						currentValue={settings.repeating.intervalCustom as number}
						allowUndefined={false}
						allowNull={false}
						disabled={locked}
						defaultValue={1}
						onChange={(value) => onChange({ schedule: { repeating: { intervalCustom: value } } })}
					/>
				</div>
				<div className="setting">
					<DateTimeInput
						label="Repeat Until"
						fullWidth
						currentValue={settings.repeating.repeatUntil}
						allowUndefined={true}
						disabled={locked}
						onChange={(value) => onChange({ schedule: { repeating: { repeatUntil: value } } })}
					/>
				</div>
			</>
		)
	} else if (settings.repeating.type === RepeatingType.DAILY) {
		return (
			<>
				<div className="setting">
					<IntInput
						label="Repeat every X day"
						fullWidth
						currentValue={settings.repeating.interval ?? 1}
						allowUndefined={false}
						disabled={locked}
						onChange={(value) => onChange({ schedule: { repeating: { interval: value } } })}
					/>
				</div>
				<div className="setting">
					<DateTimeInput
						label="Repeat Until"
						fullWidth
						currentValue={settings.repeating.repeatUntil}
						allowUndefined={true}
						disabled={locked}
						onChange={(value) => onChange({ schedule: { repeating: { repeatUntil: value } } })}
					/>
				</div>
			</>
		)
	} else if (settings.repeating.type === RepeatingType.WEEKLY) {
		const weekdaysSelect: number[] = []
		for (let i = 0; i < (settings.repeating.weekdays ?? []).length; i++) {
			if ((settings.repeating.weekdays ?? [])[i]) weekdaysSelect.push(i)
		}
		return (
			<>
				<div className="setting">
					<SelectEnumMultiple
						label="Repeat on week-day"
						fullWidth
						currentValues={weekdaysSelect}
						allowUndefined={false}
						disabled={locked}
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
							onChange({ schedule: { repeating: { weekdays: weekdays } } })
						}}
					/>
				</div>
				<div className="setting">
					<DateTimeInput
						label="Repeat Until"
						fullWidth
						currentValue={settings.repeating.repeatUntil}
						allowUndefined={true}
						disabled={locked}
						onChange={(value) => onChange({ schedule: { repeating: { repeatUntil: value } } })}
					/>
				</div>
			</>
		)
	} else if (settings.repeating.type === RepeatingType.MONTHLY) {
		return (
			<>
				<div className="setting">
					<IntInput
						label="Repeat every X month"
						fullWidth
						currentValue={settings.repeating.interval ?? 1}
						allowUndefined={false}
						disabled={locked}
						onChange={(value) => onChange({ schedule: { repeating: { interval: value } } })}
					/>
				</div>
				<div className="setting">
					<DateTimeInput
						label="Repeat Until"
						fullWidth
						currentValue={settings.repeating.repeatUntil}
						allowUndefined={true}
						disabled={locked}
						onChange={(value) => onChange({ schedule: { repeating: { repeatUntil: value } } })}
					/>
				</div>
			</>
		)
	} else {
		assertNever(settings.repeating)
		return <></>
	}
}
