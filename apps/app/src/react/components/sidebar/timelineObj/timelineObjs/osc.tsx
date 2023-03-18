import { Box, Button, Stack, Typography } from '@mui/material'
import React from 'react'
import { OSCMessageCommandContent, OSCValueType, SomeOSCValue, TimelineObjOSCAny } from 'timeline-state-resolver-types'
import { DurationInput } from '../../../inputs/DurationInput'
import { FloatInput } from '../../../inputs/FloatInput'
import { IntInput } from '../../../inputs/IntInput'
import { SelectEnum } from '../../../inputs/SelectEnum'
import { TextInput } from '../../../inputs/TextInput'
import { TrashBtn } from '../../../inputs/TrashBtn'
import { EditTimelineObjProps, EditWrapper } from './lib'

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

const EditOSCValue: React.FC<{ oscValue: SomeOSCValue; onSave: () => void }> = ({ oscValue, onSave }) => {
	return (
		<>
			<div className="setting">
				<SelectEnum
					label="Type"
					fullWidth
					currentValue={oscValue.type}
					options={OSCValueType}
					onChange={(v: OSCValueType) => {
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
						onSave()
					}}
					allowUndefined={false}
				/>
			</div>

			{oscValue.type === OSCValueType.INT && (
				<div className="setting">
					<IntInput
						label="Value"
						fullWidth
						currentValue={oscValue.value}
						onChange={(v) => {
							oscValue.value = v
							onSave()
						}}
						allowUndefined={false}
					/>
				</div>
			)}

			{oscValue.type === OSCValueType.FLOAT && (
				<div className="setting">
					<FloatInput
						label="Value"
						fullWidth
						currentValue={oscValue.value}
						onChange={(v) => {
							oscValue.value = v
							onSave()
						}}
						allowUndefined={false}
					/>
				</div>
			)}

			{oscValue.type === OSCValueType.STRING && (
				<div className="setting">
					<TextInput
						label="Value"
						fullWidth
						currentValue={oscValue.value}
						onChange={(v) => {
							oscValue.value = v
							onSave()
						}}
						allowUndefined={false}
					/>
				</div>
			)}
		</>
	)
}

export const EditTimelineObjOSCAny: React.FC<EditTimelineObjProps<TimelineObjOSCAny>> = (props) => {
	const { obj, onSave } = props
	return (
		<EditWrapper {...props}>
			<div className="setting">
				<TextInput
					label="Path"
					fullWidth
					currentValue={obj.content.path}
					onChange={(v) => {
						obj.content.path = v
						onSave(obj)
					}}
					allowUndefined={false}
				/>
			</div>

			<>
				{obj.content.values.map((oscValue, index) => (
					<React.Fragment key={index}>
						<Stack direction="row" justifyContent="space-between">
							<Typography variant="body2">Value #{index}</Typography>
							<TrashBtn
								onClick={() => {
									obj.content.values.splice(index, 1)
									onSave(obj)
								}}
								title="Delete value"
							/>
						</Stack>

						<EditOSCValue oscValue={oscValue} onSave={() => onSave(obj)} />
					</React.Fragment>
				))}
			</>

			<Button
				style={{ marginBottom: '1rem' }}
				variant="contained"
				onClick={() => {
					obj.content.values.push({
						type: OSCValueType.INT,
						value: 0,
					})
					onSave(obj)
				}}
			>
				Add Value
			</Button>
			<>
				{!obj.content.transition && (
					<Box>
						<Button
							style={{ marginBottom: '1rem' }}
							variant="contained"
							onClick={() => {
								obj.content.transition = DEFAULT_TRANSITION
								onSave(obj)
							}}
						>
							Add Transition
						</Button>
					</Box>
				)}
			</>
			<>
				{obj.content.transition && (
					<>
						<Stack direction="row" justifyContent="space-between">
							<Typography variant="body2">Transition Settings</Typography>
							<TrashBtn
								onClick={() => {
									delete obj.content.transition
									onSave(obj)
								}}
								title="Delete transition"
							/>
						</Stack>

						<div className="setting">
							<DurationInput
								label="Transition Duration (milliseconds)"
								fullWidth
								currentValue={obj.content.transition.duration}
								defaultValue={0}
								onChange={(v) => {
									if (!obj.content.transition) obj.content.transition = DEFAULT_TRANSITION
									obj.content.transition.duration = v
									onSave(obj)
								}}
								allowUndefined={false}
								allowNull={false}
							/>
						</div>

						<div className="setting">
							<SelectEnum
								label="Transition Easing Type"
								fullWidth
								currentValue={obj.content.transition.type}
								options={OSCEasingType}
								onChange={(v: OSCEasingType) => {
									if (!obj.content.transition) obj.content.transition = DEFAULT_TRANSITION
									obj.content.transition.type = v
									onSave(obj)
								}}
								allowUndefined={false}
							/>
						</div>

						<div className="setting">
							<SelectEnum
								label="Transition Easing Type"
								fullWidth
								currentValue={obj.content.transition.direction}
								options={OSCTransitionDirection}
								onChange={(v: OSCTransitionDirection) => {
									if (!obj.content.transition) obj.content.transition = DEFAULT_TRANSITION
									obj.content.transition.direction = v
									onSave(obj)
								}}
								allowUndefined={false}
							/>
						</div>

						{obj.content.from &&
							obj.content.from.map((oscValue, index) => (
								<React.Fragment key={index}>
									<Stack direction="row" justifyContent="space-between">
										<Typography variant="body2">From Value #{index}</Typography>
										<TrashBtn
											onClick={() => {
												if (!obj.content.from) return
												obj.content.from.splice(index, 1)
												onSave(obj)
											}}
											title="Delete value"
										/>
									</Stack>

									<EditOSCValue oscValue={oscValue} onSave={() => onSave(obj)} />
								</React.Fragment>
							))}

						<Button
							style={{ marginBottom: '1rem' }}
							variant="contained"
							onClick={() => {
								if (!obj.content.from) obj.content.from = []
								obj.content.from.push({
									type: OSCValueType.INT,
									value: 0,
								})
								onSave(obj)
							}}
						>
							Add From Value
						</Button>
					</>
				)}
			</>
		</EditWrapper>
	)
}
