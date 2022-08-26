import { IPCServerContext } from '../../../contexts/IPCServer'
import React, { useCallback, useContext, useState } from 'react'
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
import { Btn } from '../../inputs/Btn/Btn'

export const SideBarEditGroup: React.FC<{
	rundownId: string
	groupId: string
}> = observer(function SideBarEditGroup({ rundownId, groupId }) {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)

	const group = computed(
		() => (store.rundownsStore.hasGroup(groupId) && store.rundownsStore.getGroup(groupId)) || null
	).get()

	const handleDelete = useCallback(() => {
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
	}, [handleError, ipcServer, rundownId, groupId])

	const header = (
		<>
			<div className="title">
				<span>{`Group: ${group?.name}`}</span>
				<div>
					<TrashBtn
						disabled={group?.locked}
						onClick={() => {
							setDeleteConfirmationOpen(true)
						}}
						title="Delete Group"
					/>
				</div>
			</div>
		</>
	)
	if (!group) return null
	return (
		<SidebarContent title={header} className="edit-group">
			<DataRow label="ID" value={group.id} />

			<div className="settings">
				<div className="setting">
					<SelectEnum
						label="Playout mode"
						currentValue={group.playoutMode}
						disabled={group.locked}
						options={PlayoutMode}
						onChange={(value) => {
							ipcServer
								.updateGroup({
									rundownId,
									groupId,
									group: {
										playoutMode: value,
									},
								})
								.catch(handleError)
						}}
					/>
				</div>
				{group.playoutMode === PlayoutMode.SCHEDULE && (
					<div className="settings-group">
						<div className="setting">
							{group.schedule.activate ? (
								<Btn
									className="btn-active"
									title="Click to disable schedule"
									onClick={() => {
										ipcServer
											.updateGroup({
												rundownId,
												groupId,
												group: { schedule: { activate: false } },
											})
											.catch(handleError)
									}}
								>
									ON
								</Btn>
							) : (
								<Btn
									className="btn-inactive"
									title="Click to activate schedule"
									onClick={() => {
										ipcServer
											.updateGroup({
												rundownId,
												groupId,
												group: { schedule: { activate: true } },
											})
											.catch(handleError)
									}}
								>
									OFF
								</Btn>
							)}
						</div>
						<div className="setting">
							<DateTimeInput
								label="Start Time"
								currentValue={group.schedule.startTime}
								allowUndefined={true}
								disabled={group.locked}
								onChange={(value) => {
									ipcServer
										.updateGroup({
											rundownId,
											groupId,
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
								currentValue={group.schedule.repeating.type}
								disabled={group.locked}
								options={RepeatingType}
								onChange={(value) => {
									ipcServer
										.updateGroup({
											rundownId,
											groupId,
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
							settings={group.schedule}
							locked={group.locked}
							onChange={(groupUpdate) => {
								ipcServer
									.updateGroup({
										rundownId,
										groupId,
										group: groupUpdate,
									})
									.catch(handleError)
							}}
						/>
					</div>
				)}
				<div className="setting">
					<BooleanInput
						label="Disable playout"
						currentValue={group.disabled}
						disabled={group.locked}
						onChange={(value) => {
							ipcServer
								.toggleGroupDisable({
									rundownId,
									groupId,
									value,
								})
								.catch(handleError)
						}}
					/>
				</div>
				<div className="setting">
					<BooleanInput
						label="Lock group for editing"
						currentValue={group.locked}
						onChange={(value) => {
							ipcServer
								.toggleGroupLock({
									rundownId,
									groupId,
									value,
								})
								.catch(handleError)
						}}
					/>
				</div>
				<div className="setting">
					<BooleanInput
						label="Play one Part at a time"
						currentValue={group.oneAtATime}
						disabled={group.locked}
						onChange={(value) => {
							ipcServer
								.toggleGroupOneAtATime({
									rundownId,
									groupId,
									value,
								})
								.catch(handleError)
						}}
					/>
				</div>
				{group.oneAtATime && (
					<div className="setting">
						<BooleanInput
							label="Loop"
							currentValue={group.loop}
							disabled={group.locked}
							onChange={(value) => {
								ipcServer
									.toggleGroupLoop({
										rundownId,
										groupId,
										value,
									})
									.catch(handleError)
							}}
						/>
					</div>
				)}
				{group.oneAtATime && (
					<div className="setting">
						<BooleanInput
							label="Auto-step"
							currentValue={group.autoPlay}
							disabled={group.locked}
							onChange={(value) => {
								ipcServer
									.toggleGroupAutoplay({
										rundownId,
										groupId,
										value,
									})
									.catch(handleError)
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
					handleDelete()
					setDeleteConfirmationOpen(false)
				}}
				onDiscarded={() => {
					setDeleteConfirmationOpen(false)
				}}
			>
				<p>Are you sure you want to delete &quot;{group.name}&quot;?</p>
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
						currentValue={settings.repeating.interval ?? 1}
						allowUndefined={false}
						disabled={locked}
						onChange={(value) => onChange({ schedule: { repeating: { intervalCustom: value } } })}
					/>
				</div>
				<div className="setting">
					<DateTimeInput
						label="Repeat Until"
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
						currentValue={settings.repeating.interval ?? 1}
						allowUndefined={false}
						disabled={locked}
						onChange={(value) => onChange({ schedule: { repeating: { intervalCustom: value } } })}
					/>
				</div>
				<div className="setting">
					<DateTimeInput
						label="Repeat Until"
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
