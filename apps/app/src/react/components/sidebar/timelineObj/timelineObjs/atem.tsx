import { assertNever } from '@shared/lib'
import React from 'react'
import {
	AtemTransitionStyle,
	MediaSourceType,
	TimelineContentTypeAtem,
	TimelineObjAtemAny,
	TimelineObjAtemAudioChannel,
	TimelineObjAtemAUX,
	TimelineObjAtemDSK,
	TimelineObjAtemMacroPlayer,
	TimelineObjAtemME,
	TimelineObjAtemMediaPlayer,
	TimelineObjAtemSsrc,
	TimelineObjAtemSsrcProps,
} from 'timeline-state-resolver-types'
import { BooleanInput } from '../../../inputs/BooleanInput'
import { SelectEnum } from '../../../inputs/SelectEnum'
import { IntInput } from '../../../inputs/IntInput'
import { EditWrapper, OnSave } from './lib'
import { Button, Stack, Typography } from '@mui/material'
import { TrashBtn } from '../../../inputs/TrashBtn'
import { ATEM_DEFAULT_TRANSITION_RATE } from '../../../../../lib/TSR'

enum ATEMAudioChannelMixOption {
	Off = 0,
	On = 1,
	AFV = 2,
}

enum ATEMArtOption {
	Background = 0,
	Foreground = 1,
}

enum ATEMBorderBevel {
	None = 0,
	'In/Out' = 1,
	In = 2,
	Out = 3,
}

export const EditTimelineObjAtemAny: React.FC<{ obj: TimelineObjAtemAny; onSave: OnSave }> = ({ obj, onSave }) => {
	let settings: JSX.Element = <></>

	const obj0 = obj
	if (obj.content.type === TimelineContentTypeAtem.ME) {
		const obj = obj0 as TimelineObjAtemME
		settings = (
			<>
				<div className="setting">
					<IntInput
						label="Input"
						fullWidth
						currentValue={obj.content.me.input}
						onChange={(v) => {
							obj.content.me.input = v
							onSave(obj)
						}}
						allowUndefined={true}
						caps={[0, 99]}
					/>
				</div>
				<div className="setting">
					<SelectEnum
						label={'Transition'}
						fullWidth
						currentValue={obj.content.me.transition}
						options={AtemTransitionStyle}
						onChange={(v) => {
							obj.content.me.transition = v
							onSave(obj)
						}}
						allowUndefined={true}
					/>
				</div>
				{obj.content.me.transition === AtemTransitionStyle.MIX ? (
					<div className="setting">
						<IntInput
							label={'Transition: Mix Rate'}
							fullWidth
							currentValue={obj.content.me.transitionSettings?.mix?.rate ?? ATEM_DEFAULT_TRANSITION_RATE}
							onChange={(v) => {
								if (!obj.content.me.transitionSettings) obj.content.me.transitionSettings = {}
								if (!obj.content.me.transitionSettings.mix)
									obj.content.me.transitionSettings.mix = { rate: v }

								obj.content.me.transitionSettings.mix.rate = v
								onSave(obj)
							}}
							allowUndefined={false}
							caps={[0, Number.POSITIVE_INFINITY]}
						/>
					</div>
				) : obj.content.me.transition !== AtemTransitionStyle.CUT && obj.content.me.transition !== undefined ? (
					<>
						<div className="setting">
							<IntInput
								label={'Transition: Rate'}
								fullWidth
								currentValue={
									obj.content.me.transitionSettings?.wipe?.rate ?? ATEM_DEFAULT_TRANSITION_RATE
								}
								onChange={(v) => {
									if (!obj.content.me.transitionSettings) obj.content.me.transitionSettings = {}
									if (!obj.content.me.transitionSettings.wipe)
										obj.content.me.transitionSettings.wipe = {}

									obj.content.me.transitionSettings.wipe.rate = v
									onSave(obj)
								}}
								allowUndefined={false}
							/>
						</div>
						{/* Note: There are more options that could be implemented here, feel free to submit a PR! */}
					</>
				) : null}

				{/* Note: There are more options that could be implemented here, feel free to submit a PR! */}
			</>
		)
	} else if (obj.content.type === TimelineContentTypeAtem.DSK) {
		const obj = obj0 as TimelineObjAtemDSK

		settings = (
			<>
				<div className="setting">
					<BooleanInput
						label="DSK onAir"
						currentValue={obj.content.dsk.onAir}
						onChange={(v) => {
							obj.content.dsk.onAir = v
							onSave(obj)
						}}
					/>
				</div>
				<div className="setting">
					<IntInput
						label="DSK: Source Fill"
						fullWidth
						currentValue={obj.content.dsk.sources?.fillSource || 0}
						onChange={(v) => {
							if (!obj.content.dsk.sources)
								obj.content.dsk.sources = {
									fillSource: v,
									cutSource: 0,
								}
							obj.content.dsk.sources.fillSource = v
							onSave(obj)
						}}
						allowUndefined={false}
						caps={[0, Number.POSITIVE_INFINITY]}
					/>
				</div>

				<div className="setting">
					<IntInput
						label="DSK: Source Cut (key)"
						fullWidth
						currentValue={obj.content.dsk.sources?.cutSource || 0}
						onChange={(v) => {
							if (!obj.content.dsk.sources)
								obj.content.dsk.sources = {
									cutSource: v,
									fillSource: 0,
								}
							obj.content.dsk.sources.cutSource = v
							onSave(obj)
						}}
						allowUndefined={false}
						caps={[0, Number.POSITIVE_INFINITY]}
					/>
				</div>

				{/* Note: There are more options that could be implemented here, feel free to submit a PR! */}
			</>
		)
	} else if (obj.content.type === TimelineContentTypeAtem.AUX) {
		const obj = obj0 as TimelineObjAtemAUX
		settings = (
			<>
				<div className="setting">
					<IntInput
						label="Input"
						fullWidth
						currentValue={obj.content.aux.input}
						onChange={(v) => {
							obj.content.aux.input = v
							onSave(obj)
						}}
						allowUndefined={false}
						caps={[0, Number.POSITIVE_INFINITY]}
					/>
				</div>
			</>
		)
	} else if (obj.content.type === TimelineContentTypeAtem.SSRC) {
		const obj = obj0 as TimelineObjAtemSsrc
		settings = (
			<>
				{obj.content.ssrc.boxes.map((box, index) => (
					<React.Fragment key={index}>
						<Stack direction="row" justifyContent="space-between">
							<Typography variant="body2">Box #{index + 1}</Typography>
							<TrashBtn
								onClick={() => {
									obj.content.ssrc.boxes.splice(index, 1)
									onSave(obj)
								}}
								title="Delete SuperSource Box"
							/>
						</Stack>

						<div className="setting">
							<BooleanInput
								label="Enabled"
								currentValue={box.enabled}
								onChange={(v) => {
									box.enabled = v
									onSave(obj)
								}}
							/>
						</div>
						<div className="setting">
							<IntInput
								label="Source"
								fullWidth
								currentValue={box.source}
								onChange={(v) => {
									box.source = v
									onSave(obj)
								}}
								allowUndefined={true}
								caps={[0, Number.POSITIVE_INFINITY]}
							/>
						</div>
						<div className="setting">
							<IntInput
								label="X Position (-4800 - 4800)"
								fullWidth
								currentValue={box.x}
								onChange={(v) => {
									box.x = v
									onSave(obj)
								}}
								allowUndefined={true}
								caps={[-4800, 4800]}
							/>
						</div>
						<div className="setting">
							<IntInput
								label="Y Position (-2700 - 2700)"
								fullWidth
								currentValue={box.y}
								onChange={(v) => {
									box.y = v
									onSave(obj)
								}}
								allowUndefined={true}
								caps={[-2700, 2700]}
							/>
						</div>
						<div className="setting">
							<IntInput
								label="Size (70 - 1000)"
								fullWidth
								currentValue={box.size}
								onChange={(v) => {
									box.size = v
									onSave(obj)
								}}
								allowUndefined={true}
								caps={[70, 1000]}
							/>
						</div>
						<div className="setting">
							<BooleanInput
								label="Cropped"
								currentValue={box.cropped}
								onChange={(v) => {
									box.cropped = v
									onSave(obj)
								}}
							/>
						</div>
						<div className="setting">
							<IntInput
								label="Crop Top (0 - 18000)"
								fullWidth
								currentValue={box.cropTop}
								onChange={(v) => {
									box.cropTop = v
									onSave(obj)
								}}
								allowUndefined={true}
								caps={[0, 18000]}
							/>
						</div>
						<div className="setting">
							<IntInput
								label="Crop Bottom (0 - 18000)"
								fullWidth
								currentValue={box.cropBottom}
								onChange={(v) => {
									box.cropBottom = v
									onSave(obj)
								}}
								allowUndefined={true}
								caps={[0, 18000]}
							/>
						</div>
						<div className="setting">
							<IntInput
								label="Crop Left (0 - 32000)"
								fullWidth
								currentValue={box.cropLeft}
								onChange={(v) => {
									box.cropLeft = v
									onSave(obj)
								}}
								allowUndefined={true}
								caps={[0, 32000]}
							/>
						</div>
						<div className="setting">
							<IntInput
								label="Crop Right (0 - 32000)"
								fullWidth
								currentValue={box.cropRight}
								onChange={(v) => {
									box.cropRight = v
									onSave(obj)
								}}
								allowUndefined={true}
								caps={[0, 32000]}
							/>
						</div>
					</React.Fragment>
				))}

				<Button
					variant="contained"
					onClick={() => {
						obj.content.ssrc.boxes.push({})
						onSave(obj)
					}}
				>
					Add Box
				</Button>
			</>
		)
	} else if (obj.content.type === TimelineContentTypeAtem.SSRCPROPS) {
		const obj = obj0 as TimelineObjAtemSsrcProps
		settings = (
			<>
				<div className="setting">
					<IntInput
						label="Art Fill Source"
						fullWidth
						currentValue={obj.content.ssrcProps.artFillSource}
						onChange={(v) => {
							obj.content.ssrcProps.artFillSource = v
							onSave(obj)
						}}
						allowUndefined={false}
						caps={[0, Number.POSITIVE_INFINITY]}
					/>
				</div>
				<div className="setting">
					<IntInput
						label="Art Cut (Key) Source"
						fullWidth
						currentValue={obj.content.ssrcProps.artCutSource}
						onChange={(v) => {
							obj.content.ssrcProps.artCutSource = v
							onSave(obj)
						}}
						allowUndefined={false}
						caps={[0, Number.POSITIVE_INFINITY]}
					/>
				</div>
				<div className="setting">
					<SelectEnum
						label={'Art Option'}
						fullWidth
						currentValue={obj.content.ssrcProps.artOption}
						options={ATEMArtOption}
						onChange={(v) => {
							obj.content.ssrcProps.artOption = v
							onSave(obj)
						}}
					/>
				</div>
				<div className="setting">
					<BooleanInput
						label="Art Pre-Multiplied"
						currentValue={obj.content.ssrcProps.artPreMultiplied}
						onChange={(v) => {
							obj.content.ssrcProps.artPreMultiplied = v
							onSave(obj)
						}}
					/>
				</div>
				{obj.content.ssrcProps.artPreMultiplied === false && (
					<>
						<div className="setting">
							<IntInput
								label="Art Clip (0 - 1000)"
								fullWidth
								currentValue={obj.content.ssrcProps.artClip}
								onChange={(v) => {
									if (obj.content.ssrcProps.artPreMultiplied) {
										return
									}
									obj.content.ssrcProps.artClip = v
									onSave(obj)
								}}
								allowUndefined={false}
								caps={[0, 1000]}
							/>
						</div>
						<div className="setting">
							<IntInput
								label="Art Gain (0 - 1000)"
								fullWidth
								currentValue={obj.content.ssrcProps.artGain}
								onChange={(v) => {
									if (obj.content.ssrcProps.artPreMultiplied) {
										return
									}
									obj.content.ssrcProps.artGain = v
									onSave(obj)
								}}
								allowUndefined={false}
								caps={[0, 1000]}
							/>
						</div>
						<div className="setting">
							<BooleanInput
								label="Art Invert Key"
								currentValue={obj.content.ssrcProps.artInvertKey}
								onChange={(v) => {
									if (obj.content.ssrcProps.artPreMultiplied) {
										return
									}
									obj.content.ssrcProps.artInvertKey = v
									onSave(obj)
								}}
							/>
						</div>
					</>
				)}
				<div className="setting">
					<BooleanInput
						label="Border Enabled"
						currentValue={obj.content.ssrcProps.borderEnabled}
						onChange={(v) => {
							obj.content.ssrcProps.borderEnabled = v
							onSave(obj)
						}}
					/>
				</div>
				{obj.content.ssrcProps.borderEnabled && (
					<>
						<div className="setting">
							<SelectEnum
								label="Border Bevel"
								fullWidth
								currentValue={obj.content.ssrcProps.borderBevel}
								options={ATEMBorderBevel}
								onChange={(v) => {
									if (!obj.content.ssrcProps.borderEnabled) {
										return
									}
									obj.content.ssrcProps.borderBevel = v
									onSave(obj)
								}}
								allowUndefined={false}
							/>
						</div>
						<div className="setting">
							<IntInput
								label="Border Outer Width (0 - 1600)"
								fullWidth
								currentValue={obj.content.ssrcProps.borderOuterWidth}
								onChange={(v) => {
									if (!obj.content.ssrcProps.borderEnabled) {
										return
									}
									obj.content.ssrcProps.borderOuterWidth = v
									onSave(obj)
								}}
								allowUndefined={false}
								caps={[0, 1600]}
							/>
						</div>
						<div className="setting">
							<IntInput
								label="Border Inner Width (0 - 1600)"
								fullWidth
								currentValue={obj.content.ssrcProps.borderInnerWidth}
								onChange={(v) => {
									if (!obj.content.ssrcProps.borderEnabled) {
										return
									}
									obj.content.ssrcProps.borderInnerWidth = v
									onSave(obj)
								}}
								allowUndefined={false}
								caps={[0, 1600]}
							/>
						</div>
						<div className="setting">
							<IntInput
								label="Border Outer Softness (0 - 100)"
								fullWidth
								currentValue={obj.content.ssrcProps.borderOuterSoftness}
								onChange={(v) => {
									if (!obj.content.ssrcProps.borderEnabled) {
										return
									}
									obj.content.ssrcProps.borderOuterSoftness = v
									onSave(obj)
								}}
								allowUndefined={false}
								caps={[0, 100]}
							/>
						</div>
						<div className="setting">
							<IntInput
								label="Border Inner Softness (0 - 100)"
								fullWidth
								currentValue={obj.content.ssrcProps.borderInnerSoftness}
								onChange={(v) => {
									if (!obj.content.ssrcProps.borderEnabled) {
										return
									}
									obj.content.ssrcProps.borderInnerSoftness = v
									onSave(obj)
								}}
								allowUndefined={false}
								caps={[0, 100]}
							/>
						</div>
						<div className="setting">
							<IntInput
								label="Border Bevel Softness (0 - 100)"
								fullWidth
								currentValue={obj.content.ssrcProps.borderBevelSoftness}
								onChange={(v) => {
									if (!obj.content.ssrcProps.borderEnabled) {
										return
									}
									obj.content.ssrcProps.borderBevelSoftness = v
									onSave(obj)
								}}
								allowUndefined={false}
								caps={[0, 100]}
							/>
						</div>
						<div className="setting">
							<IntInput
								label="Border Bevel Position (0 - 100)"
								fullWidth
								currentValue={obj.content.ssrcProps.borderBevelPosition}
								onChange={(v) => {
									if (!obj.content.ssrcProps.borderEnabled) {
										return
									}
									obj.content.ssrcProps.borderBevelPosition = v
									onSave(obj)
								}}
								allowUndefined={false}
								caps={[0, 100]}
							/>
						</div>
						<div className="setting">
							<IntInput
								label="Border Hue (0 - 3599)"
								fullWidth
								currentValue={obj.content.ssrcProps.borderHue}
								onChange={(v) => {
									if (!obj.content.ssrcProps.borderEnabled) {
										return
									}
									obj.content.ssrcProps.borderHue = v
									onSave(obj)
								}}
								allowUndefined={false}
								caps={[0, 3599]}
							/>
						</div>
						<div className="setting">
							<IntInput
								label="Border Saturation (0 - 1000)"
								fullWidth
								currentValue={obj.content.ssrcProps.borderSaturation}
								onChange={(v) => {
									if (!obj.content.ssrcProps.borderEnabled) {
										return
									}
									obj.content.ssrcProps.borderSaturation = v
									onSave(obj)
								}}
								allowUndefined={false}
								caps={[0, 1000]}
							/>
						</div>
						<div className="setting">
							<IntInput
								label="Border Luma (0 - 1000)"
								fullWidth
								currentValue={obj.content.ssrcProps.borderLuma}
								onChange={(v) => {
									if (!obj.content.ssrcProps.borderEnabled) {
										return
									}
									obj.content.ssrcProps.borderLuma = v
									onSave(obj)
								}}
								allowUndefined={false}
								caps={[0, 1000]}
							/>
						</div>
						<div className="setting">
							<IntInput
								label="Border Light Source Direction (0 - 3590)"
								fullWidth
								currentValue={obj.content.ssrcProps.borderLightSourceDirection}
								onChange={(v) => {
									if (!obj.content.ssrcProps.borderEnabled) {
										return
									}
									obj.content.ssrcProps.borderLightSourceDirection = v
									onSave(obj)
								}}
								allowUndefined={false}
								caps={[0, 3590]}
							/>
						</div>
						<div className="setting">
							<IntInput
								label="Border Light Source Altitude (10 - 100)"
								fullWidth
								currentValue={obj.content.ssrcProps.borderLightSourceAltitude}
								onChange={(v) => {
									if (!obj.content.ssrcProps.borderEnabled) {
										return
									}
									obj.content.ssrcProps.borderLightSourceAltitude = v
									onSave(obj)
								}}
								allowUndefined={false}
								caps={[10, 100]}
							/>
						</div>
					</>
				)}
			</>
		)
	} else if (obj.content.type === TimelineContentTypeAtem.MEDIAPLAYER) {
		const obj = obj0 as TimelineObjAtemMediaPlayer
		settings = (
			<>
				<div className="setting">
					<SelectEnum
						label={'Source Type'}
						fullWidth
						currentValue={obj.content.mediaPlayer.sourceType}
						options={MediaSourceType}
						onChange={(v) => {
							obj.content.mediaPlayer.sourceType = v
							onSave(obj)
						}}
						allowUndefined={true}
					/>
				</div>
				<div className="setting">
					<IntInput
						label="Clip Index"
						fullWidth
						currentValue={obj.content.mediaPlayer.clipIndex}
						onChange={(v) => {
							obj.content.mediaPlayer.clipIndex = v
							onSave(obj)
						}}
						allowUndefined={false}
						caps={[0, Number.POSITIVE_INFINITY]}
					/>
				</div>
				<div className="setting">
					<IntInput
						label="Still Index"
						fullWidth
						currentValue={obj.content.mediaPlayer.stillIndex}
						onChange={(v) => {
							obj.content.mediaPlayer.stillIndex = v
							onSave(obj)
						}}
						allowUndefined={false}
						caps={[0, Number.POSITIVE_INFINITY]}
					/>
				</div>
				<div className="setting">
					<BooleanInput
						label="Playing"
						currentValue={obj.content.mediaPlayer.playing}
						onChange={(v) => {
							obj.content.mediaPlayer.playing = v
							onSave(obj)
						}}
					/>
				</div>
				<div className="setting">
					<BooleanInput
						label="Loop"
						currentValue={obj.content.mediaPlayer.loop}
						onChange={(v) => {
							obj.content.mediaPlayer.loop = v
							onSave(obj)
						}}
					/>
				</div>
				<div className="setting">
					<BooleanInput
						label="At Beginning"
						currentValue={obj.content.mediaPlayer.atBeginning}
						onChange={(v) => {
							obj.content.mediaPlayer.atBeginning = v
							onSave(obj)
						}}
					/>
				</div>
				<div className="setting">
					<IntInput
						label="Clip Frame"
						fullWidth
						currentValue={obj.content.mediaPlayer.clipFrame}
						onChange={(v) => {
							obj.content.mediaPlayer.clipFrame = v
							onSave(obj)
						}}
						allowUndefined={false}
						caps={[0, Number.POSITIVE_INFINITY]}
					/>
				</div>
			</>
		)
	} else if (obj.content.type === TimelineContentTypeAtem.MACROPLAYER) {
		const obj = obj0 as TimelineObjAtemMacroPlayer
		settings = (
			<>
				<div className="setting">
					<IntInput
						label="Macro Index"
						fullWidth
						currentValue={obj.content.macroPlayer.macroIndex}
						onChange={(v) => {
							obj.content.macroPlayer.macroIndex = v
							onSave(obj)
						}}
						allowUndefined={false}
						caps={[0, Number.POSITIVE_INFINITY]}
					/>
				</div>
				<div className="setting">
					<BooleanInput
						label="Macro Player isRunning"
						currentValue={obj.content.macroPlayer.isRunning}
						onChange={(v) => {
							obj.content.macroPlayer.isRunning = v
							onSave(obj)
						}}
					/>
				</div>
				<div className="setting">
					<BooleanInput
						label="Macro Loop"
						currentValue={obj.content.macroPlayer.loop}
						onChange={(v) => {
							obj.content.macroPlayer.loop = v
							onSave(obj)
						}}
					/>
				</div>
			</>
		)
	} else if (obj.content.type === TimelineContentTypeAtem.AUDIOCHANNEL) {
		const obj = obj0 as TimelineObjAtemAudioChannel
		settings = (
			<>
				<div className="setting">
					<IntInput
						label="Gain (0 - 65381)"
						fullWidth
						currentValue={obj.content.audioChannel.gain}
						onChange={(v) => {
							obj.content.audioChannel.gain = v
							onSave(obj)
						}}
						allowUndefined={true}
						caps={[0, 65381]}
					/>
				</div>
				<div className="setting">
					<IntInput
						label="Balance (-10000 - 10000)"
						fullWidth
						currentValue={obj.content.audioChannel.balance}
						onChange={(v) => {
							obj.content.audioChannel.balance = v
							onSave(obj)
						}}
						allowUndefined={true}
						caps={[-10000, 10000]}
					/>
				</div>
				<div className="setting">
					<SelectEnum
						label="Mix Option"
						fullWidth
						currentValue={obj.content.audioChannel.mixOption}
						options={ATEMAudioChannelMixOption}
						onChange={(v) => {
							obj.content.audioChannel.mixOption = v
							onSave(obj)
						}}
						allowUndefined={true}
					/>
				</div>
			</>
		)
	} else {
		assertNever(obj.content)
	}

	return (
		<EditWrapper obj={obj} onSave={onSave}>
			{settings}
		</EditWrapper>
	)
}
