import React, { useContext } from 'react'
import { getCompatibleMappings } from '../../../../../lib/TSRMappings'
import { TSRTimelineObj } from 'timeline-state-resolver-types'
import { ProjectContext } from '../../../../contexts/Project'
import { DurationInput } from '../../../inputs/DurationInput'
import { TextInput } from '../../../inputs/TextInput'
import { PartialDeep } from 'type-fest'
import { firstValue, isIndeterminate, inputValue } from '../../../../lib/multipleEdit'
import { SelectEnum } from '../../../inputs/SelectEnum'
import { useMemoComputedObject } from '../../../../mobx/lib'

export type OnSave = (update: PartialDeep<TSRTimelineObj>) => void
export type OnSaveType<T> = (update: PartialDeep<T>) => void

export const EditWrapper: React.FC<{
	objs: TSRTimelineObj[]
	onSave: OnSave
	children: JSX.Element | JSX.Element[]
}> = ({ objs, onSave, children }) => {
	const project = useContext(ProjectContext)

	// const enable = firstValue(objs, (obj) => (Array.isArray(obj.enable) ? obj.enable[0] : obj.enable))
	const enables = objs.map((obj) => (Array.isArray(obj.enable) ? obj.enable[0] : obj.enable))
	// const enableIndeterminate = isIndeterminate(objs, (obj) => (Array.isArray(obj.enable) ? obj.enable[0] : obj.enable))

	const startTypeIndeterminate = isIndeterminate(enables, (enable) => typeof enable.start)
	const startIsExpression = firstValue(enables, (enable) => typeof enable.start === 'string')

	const durationTypeIndeterminate = isIndeterminate(enables, (enable) => typeof enable.duration)
	const durationIsExpression = firstValue(enables, (enable) => typeof enable.duration === 'string')

	// const enableStartNum = typeof enable.start === 'number' ? enable.start : 0
	// const enableStartExpression = typeof enable.start === 'string' ? enable.start : ''

	// const enableDurationNum = typeof enable.duration === 'number' ? enable.duration : null
	// const enableDurationExpression = typeof enable.duration === 'string' ? enable.duration : ''

	const mappingOptions: { value: string; label: string }[] = useMemoComputedObject(
		() => {
			// const partTimeline = store.rundownsStore.getPartTimeline(partId)
			// const objectsOnThisLayer = partTimeline.filter((obj) => obj.obj.layer === layerId)

			return getCompatibleMappings(project.mappings, objs).map((m) => ({
				value: m.layerId,
				label: m.mapping.layerName || m.layerId,
			}))
		},
		[project.mappings, objs],
		true
	)

	return (
		<div className="edit-timeline-obj">
			<div className="settings">
				<div className="setting">
					<SelectEnum
						label="Layer"
						{...inputValue(objs, (obj) => obj.layer, undefined)}
						onChange={(e) => {
							onSave({
								layer: e.target.value,
							})
						}}
						options={mappingOptions}
					/>

					{startTypeIndeterminate ? (
						<>--Different start types --</>
					) : startIsExpression ? (
						<TextInput
							label="Start"
							fullWidth
							allowUndefined={false}
							{...inputValue(
								enables,
								(enable) => (typeof enable.start === 'string' ? enable.start : ''),
								''
							)}
							onChange={(newVal) => {
								onSave({
									enable: {
										start: newVal,
										while: undefined,
									},
								})
							}}
						/>
					) : (
						<DurationInput
							label="Start"
							fullWidth
							allowUndefined={false}
							allowNull={false}
							defaultValue={0}
							{...inputValue(
								enables,
								(enable) => (typeof enable.start === 'number' ? enable.start : 0),
								0
							)}
							onChange={(newVal) => {
								onSave({
									enable: {
										start: newVal,
										while: undefined,
									},
								})
							}}
						/>
					)}

					{durationTypeIndeterminate ? (
						<>--Different start types --</>
					) : durationIsExpression ? (
						<TextInput
							label="Duration"
							fullWidth
							allowUndefined={false}
							{...inputValue(
								enables,
								(enable) => (typeof enable.duration === 'string' ? enable.duration : ''),
								''
							)}
							onChange={(newVal) => {
								onSave({
									enable: {
										duration: newVal,
										end: undefined,
										while: undefined,
									},
								})
							}}
						/>
					) : (
						<DurationInput
							label="Duration"
							fullWidth
							allowUndefined={false}
							allowNull={true}
							defaultValue={null}
							emptyPlaceholder="Infinite"
							{...inputValue(
								enables,
								(enable) => {
									return enable.duration === null
										? null
										: typeof enable.duration === 'number'
										? enable.duration
										: 0
								},
								0
							)}
							onChange={(newVal) => {
								onSave({
									enable: {
										duration: newVal,
										end: undefined,
										while: undefined,
									},
								})
							}}
						/>
					)}
				</div>
				{children}
			</div>
		</div>
	)
}

export const NOT_IMPLEMENTED_SETTINGS = (
	<div className="setting">
		<label>Not implemented</label>
		<div>
			<i>
				Support for this type of timeline object hasn&apos;t been implemented yet. Feel free to submit a pull
				request!
			</i>
		</div>
	</div>
)
