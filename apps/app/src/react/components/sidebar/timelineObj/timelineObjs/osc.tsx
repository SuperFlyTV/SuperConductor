import { Box, Button, Stack, Typography } from '@mui/material'
import { deepClone } from '@shared/lib'
import React from 'react'
import {
	OSCMessageCommandContent,
	OSCValueType,
	SomeOSCValue,
	TSRTimelineObj,
	TimelineContentOSCAny,
} from 'timeline-state-resolver-types'
import { firstValue, inputValue, isIndeterminate } from '../../../../lib/multipleEdit'
import { DurationInput } from '../../../inputs/DurationInput'
import { FloatInput } from '../../../inputs/FloatInput'
import { IntInput } from '../../../inputs/IntInput'
import { SelectEnum } from '../../../inputs/SelectEnum'
import { TextInput } from '../../../inputs/TextInput'
import { TrashBtn } from '../../../inputs/TrashBtn'
import { EditWrapper, OnSave, OnSaveType } from './lib'

enum OSCEasingType {
	Linear = 'Linear',
	Quadratic = 'Quadratic',
	Cubic = 'Cubic',
	Quartic = 'Quartic',
	Quintic = 'Quintic',
	Sinusoidal = 'Sinusoidal',
	Exponential = 'Exponential',
	Circular = 'Circular',
	Elastic = 'Elastic',
	Back = 'Back',
	Bounce = 'Bounce',
}

enum OSCTransitionDirection {
	In = 'In',
	Out = 'Out',
	InOut = 'InOut',
	None = 'None',
}

const DEFAULT_TRANSITION: OSCMessageCommandContent['transition'] = {
	duration: 0,
	type: OSCEasingType.Linear,
	direction: OSCTransitionDirection.InOut,
}

export const EditTimelineObjOSCAny: React.FC<{ objs: TSRTimelineObj<TimelineContentOSCAny>[]; onSave: OnSave }> = ({
	objs,
	onSave: onSave0,
}) => {
	const contentType = firstValue(objs, (obj) => obj.content.type)
	if (!contentType) return null

	const firstObj = objs[0]
	if (!firstObj) return null

	const onSave = onSave0 as OnSaveType<TSRTimelineObj<TimelineContentOSCAny>>
	return (
		<EditWrapper objs={objs} onSave={onSave0}>
			<div className="setting">
				<TextInput
					label="Path"
					fullWidth
					{...inputValue(objs, (obj) => obj.content.path, '')}
					onChange={(v) => {
						onSave({ content: { path: v } })
					}}
					allowUndefined={false}
				/>
			</div>

			<>
				{isIndeterminate(objs, (obj) => obj.content.values) ? (
					<>-- Different values-- </>
				) : (
					<>
						{firstObj.content.values.map((oscValue, index) => (
							<React.Fragment key={index}>
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="body2">Value #{index}</Typography>
									<TrashBtn
										onClick={() => {
											const values = deepClone(firstObj.content.values)
											values.splice(index, 1)
											onSave({ content: { values } })
										}}
										title="Delete value"
									/>
								</Stack>

								<EditOSCValue
									oscValue={oscValue}
									onSave={(newOscValue) => {
										const values = deepClone(firstObj.content.values)
										values[index] = newOscValue
										onSave({ content: { values } })
									}}
								/>
							</React.Fragment>
						))}
						<Button
							style={{ marginBottom: '1rem' }}
							variant="contained"
							onClick={() => {
								const values = deepClone(firstObj.content.values)
								values.push({
									type: OSCValueType.INT,
									value: 0,
								})
								onSave({ content: { values } })
							}}
						>
							Add Value
						</Button>
					</>
				)}
			</>

			{isIndeterminate(objs, (obj) => obj.content.transition === undefined) ? (
				<>-- Different values--</>
			) : !firstObj.content.transition ? (
				<Box>
					<Button
						style={{ marginBottom: '1rem' }}
						variant="contained"
						onClick={() => {
							onSave({ content: { transition: DEFAULT_TRANSITION } })
						}}
					>
						Add Transition
					</Button>
				</Box>
			) : (
				<>
					<Stack direction="row" justifyContent="space-between">
						<Typography variant="body2">Transition Settings</Typography>
						<TrashBtn
							onClick={() => {
								onSave({ content: { transition: undefined } })
							}}
							title="Delete transition"
						/>
					</Stack>

					<div className="setting">
						<DurationInput
							label="Transition Duration (milliseconds)"
							fullWidth
							{...inputValue(objs, (obj) => obj.content.transition?.duration, 0)}
							defaultValue={0}
							onChange={(v) => {
								onSave({ content: { transition: { duration: v } } })
							}}
							allowUndefined={false}
							allowNull={false}
						/>
					</div>

					<div className="setting">
						<SelectEnum
							label="Transition Easing Type"
							fullWidth
							{...inputValue(objs, (obj) => obj.content.transition?.type, undefined)}
							options={OSCEasingType}
							onChange={(v: OSCEasingType) => {
								onSave({ content: { transition: { type: v } } })
							}}
							allowUndefined={false}
						/>
					</div>

					<div className="setting">
						<SelectEnum
							label="Transition Easing Type"
							fullWidth
							{...inputValue(objs, (obj) => obj.content.transition?.direction, undefined)}
							options={OSCTransitionDirection}
							onChange={(v: OSCTransitionDirection) => {
								onSave({ content: { transition: { direction: v } } })
							}}
							allowUndefined={false}
						/>
					</div>

					{isIndeterminate(objs, (obj) => obj.content.from) ? (
						<>--Different values--</>
					) : (
						<>
							{firstObj.content.from &&
								firstObj.content.from.map((oscValue, index) => (
									<React.Fragment key={index}>
										<Stack direction="row" justifyContent="space-between">
											<Typography variant="body2">From Value #{index}</Typography>
											<TrashBtn
												onClick={() => {
													if (!firstObj.content.from) return

													const from = deepClone(firstObj.content.from)
													from.splice(index, 1)
													onSave({ content: { from } })
												}}
												title="Delete value"
											/>
										</Stack>

										<EditOSCValue
											oscValue={oscValue}
											onSave={(newOscValue) => {
												const from = deepClone(firstObj.content.from) || []
												from[index] = newOscValue
												onSave({ content: { from } })
											}}
										/>
									</React.Fragment>
								))}
							<Button
								style={{ marginBottom: '1rem' }}
								variant="contained"
								onClick={() => {
									if (!firstObj.content.from) firstObj.content.from = []
									const from = deepClone(firstObj.content.from)
									from.push({
										type: OSCValueType.INT,
										value: 0,
									})
									onSave({ content: { from } })
								}}
							>
								Add From Value
							</Button>
						</>
					)}
				</>
			)}
		</EditWrapper>
	)
}

const EditOSCValue: React.FC<{ oscValue: SomeOSCValue; onSave: (newOscValue: SomeOSCValue) => void }> = ({
	oscValue: oscValue0,
	onSave,
}) => {
	return (
		<>
			<div className="setting">
				<SelectEnum
					label="Type"
					fullWidth
					currentValue={oscValue0.type}
					options={OSCValueType}
					onChange={(v: OSCValueType) => {
						const oscValue = deepClone(oscValue0)
						if (v === OSCValueType.INT || v === OSCValueType.FLOAT) {
							oscValue.value = 0
						} else if (v === OSCValueType.STRING) {
							oscValue.value = ''
						} else if (v === OSCValueType.BLOB) {
							oscValue.value = new Uint8Array()
						} else if (v === OSCValueType.TRUE || v === OSCValueType.FALSE) {
							oscValue.value = undefined
						}

						oscValue.type = v
						onSave(oscValue)
					}}
					allowUndefined={false}
				/>
			</div>

			{oscValue0.type === OSCValueType.INT && (
				<div className="setting">
					<IntInput
						label="Value"
						fullWidth
						currentValue={oscValue0.value}
						onChange={(v) => {
							const oscValue = deepClone(oscValue0)
							oscValue.value = v
							onSave(oscValue)
						}}
						allowUndefined={false}
					/>
				</div>
			)}

			{oscValue0.type === OSCValueType.FLOAT && (
				<div className="setting">
					<FloatInput
						label="Value"
						fullWidth
						currentValue={oscValue0.value}
						onChange={(v) => {
							const oscValue = deepClone(oscValue0)
							oscValue.value = v
							onSave(oscValue)
						}}
						allowUndefined={false}
					/>
				</div>
			)}

			{oscValue0.type === OSCValueType.STRING && (
				<div className="setting">
					<TextInput
						label="Value"
						fullWidth
						currentValue={oscValue0.value}
						onChange={(v) => {
							const oscValue = deepClone(oscValue0)
							oscValue.value = v
							onSave(oscValue)
						}}
						allowUndefined={false}
					/>
				</div>
			)}
		</>
	)
}
