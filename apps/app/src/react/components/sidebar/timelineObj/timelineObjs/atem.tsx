import { assertNever, deepClone, literal } from '@shared/lib'
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
import { EditWrapper, OnSave, OnSaveType } from './lib'
import { Button, Stack, Typography } from '@mui/material'
import { TrashBtn } from '../../../inputs/TrashBtn'
import { ATEM_DEFAULT_TRANSITION_RATE } from '../../../../../lib/TSR'
import { PartialDeep } from 'type-fest'
import deepExtend from 'deep-extend'
import { firstValue, isIndeterminate, inputValue } from '../../../../lib/multipleEdit'

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

export const EditTimelineObjAtemAny: React.FC<{ objs: TimelineObjAtemAny[]; onSave: OnSave }> = ({
	objs,
	onSave: onSave0,
}) => {
	let settings: JSX.Element = <></>

	if (isIndeterminate(objs, (obj) => obj.content.type)) {
		return <>-- Different types --</>
	}
	const contentType = firstValue(objs, (obj) => obj.content.type)
	if (!contentType) return null

	const objs0 = objs
	// const onSave0 = onSave
	if (contentType === TimelineContentTypeAtem.ME) {
		const objs = objs0 as TimelineObjAtemME[]
		const firstObj = objs[0]
		if (!firstObj) return null

		const onSave = onSave0 as OnSaveType<TimelineObjAtemME>
		settings = (
			<>
				<div className="setting">
					<IntInput
						label="Input"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.me.input, undefined)}
						onChange={(v) => {
							onSave({
								content: { me: { input: v } },
							})
						}}
						allowUndefined={true}
						caps={[0, Number.POSITIVE_INFINITY]}
					/>
				</div>
				<div className="setting">
					<SelectEnum
						label={'Transition'}
						fullWidth
						{...inputValue(objs, (obj) => obj.content.me.transition, undefined)}
						options={AtemTransitionStyle}
						onChange={(v) => {
							onSave({ content: { me: { transition: v } } })
						}}
						allowUndefined={true}
					/>
				</div>
				{isIndeterminate(objs, (obj) => obj.content.me.transition) ? (
					<>-- Different transitions --</>
				) : firstObj.content.me.transition === AtemTransitionStyle.MIX ? (
					<div className="setting">
						<IntInput
							label={'Transition: Mix Rate'}
							fullWidth
							{...inputValue(
								objs,
								(obj) => obj.content.me.transitionSettings?.mix?.rate,
								ATEM_DEFAULT_TRANSITION_RATE
							)}
							onChange={(v) => {
								onSave({
									content: { me: { transitionSettings: { mix: { rate: v } } } },
								})
							}}
							allowUndefined={false}
							caps={[0, Number.POSITIVE_INFINITY]}
						/>
					</div>
				) : firstObj.content.me.transition !== AtemTransitionStyle.CUT &&
				  firstObj.content.me.transition !== undefined ? (
					<>
						<div className="setting">
							<IntInput
								label={'Transition: Rate'}
								fullWidth
								{...inputValue(
									objs,
									(obj) => obj.content.me.transitionSettings?.wipe?.rate,
									ATEM_DEFAULT_TRANSITION_RATE
								)}
								onChange={(v) => {
									onSave({
										content: { me: { transitionSettings: { wipe: { rate: v } } } },
									})
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
	} else if (contentType === TimelineContentTypeAtem.DSK) {
		const objs = objs0 as TimelineObjAtemDSK[]
		const firstObj = objs[0]
		if (!firstObj) return null
		const onSave = onSave0 as OnSaveType<TimelineObjAtemDSK>

		settings = (
			<>
				<div className="setting">
					<BooleanInput
						label="DSK onAir"
						{...inputValue(objs, (obj) => obj.content.dsk.onAir, undefined)}
						onChange={(v) => {
							onSave({
								content: { dsk: { onAir: v } },
							})
						}}
					/>
				</div>
				<div className="setting">
					<IntInput
						label="DSK: Source Fill"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.dsk.sources?.fillSource, 0)}
						onChange={(v) => {
							const mod: PartialDeep<TimelineObjAtemDSK> = {
								content: { dsk: { sources: { fillSource: v } } },
							}
							if (!firstObj.content.dsk.sources) {
								deepExtend(
									mod,
									literal<PartialDeep<TimelineObjAtemDSK>>({
										content: { dsk: { sources: { fillSource: v, cutSource: 0 } } },
									})
								)
							}
							onSave(mod)
						}}
						allowUndefined={false}
						caps={[0, Number.POSITIVE_INFINITY]}
					/>
				</div>

				<div className="setting">
					<IntInput
						label="DSK: Source Cut (key)"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.dsk.sources?.cutSource, 0)}
						onChange={(v) => {
							const mod: PartialDeep<TimelineObjAtemDSK> = {
								content: { dsk: { sources: { cutSource: v } } },
							}
							if (!firstObj.content.dsk.sources) {
								deepExtend(
									mod,
									literal<PartialDeep<TimelineObjAtemDSK>>({
										content: { dsk: { sources: { cutSource: v, fillSource: 0 } } },
									})
								)
							}
							onSave(mod)
						}}
						allowUndefined={false}
						caps={[0, Number.POSITIVE_INFINITY]}
					/>
				</div>

				{/* Note: There are more options that could be implemented here, feel free to submit a PR! */}
			</>
		)
	} else if (contentType === TimelineContentTypeAtem.AUX) {
		const objs = objs0 as TimelineObjAtemAUX[]
		const firstObj = objs[0]
		if (!firstObj) return null
		const onSave = onSave0 as OnSaveType<TimelineObjAtemAUX>
		settings = (
			<>
				<div className="setting">
					<IntInput
						label="Input"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.aux.input, 0)}
						onChange={(v) => {
							onSave({ content: { aux: { input: v } } })
						}}
						allowUndefined={false}
						caps={[0, Number.POSITIVE_INFINITY]}
					/>
				</div>
			</>
		)
	} else if (contentType === TimelineContentTypeAtem.SSRC) {
		const objs = objs0 as TimelineObjAtemSsrc[]
		const firstObj = objs[0]
		if (!firstObj) return null
		const onSave = onSave0 as OnSaveType<TimelineObjAtemSsrc>

		if (isIndeterminate(objs, (obj) => obj.content.ssrc.boxes)) {
			return <>-- Different SSRC values --</>
		}
		// Deep clone, because it is modified when updated:
		const boxes = deepClone(firstObj.content.ssrc.boxes)

		settings = (
			<>
				{boxes.map((box, index) => (
					<React.Fragment key={index}>
						<Stack direction="row" justifyContent="space-between">
							<Typography variant="body2">Box #{index + 1}</Typography>
							<TrashBtn
								onClick={() => {
									boxes.splice(index, 1)
									onSave({ content: { ssrc: { boxes } } })
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
									onSave({ content: { ssrc: { boxes } } })
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
									onSave({ content: { ssrc: { boxes } } })
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
									onSave({ content: { ssrc: { boxes } } })
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
									onSave({ content: { ssrc: { boxes } } })
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
									onSave({ content: { ssrc: { boxes } } })
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
									onSave({ content: { ssrc: { boxes } } })
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
									onSave({ content: { ssrc: { boxes } } })
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
									onSave({ content: { ssrc: { boxes } } })
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
									onSave({ content: { ssrc: { boxes } } })
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
									onSave({ content: { ssrc: { boxes } } })
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
						boxes.push({})
						onSave({ content: { ssrc: { boxes } } })
					}}
				>
					Add Box
				</Button>
			</>
		)
	} else if (contentType === TimelineContentTypeAtem.SSRCPROPS) {
		const objs = objs0 as TimelineObjAtemSsrcProps[]
		const firstObj = objs[0]
		if (!firstObj) return null
		const onSave = onSave0 as OnSaveType<TimelineObjAtemSsrcProps>
		settings = (
			<>
				<div className="setting">
					<IntInput
						label="Art Fill Source"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.ssrcProps.artFillSource, 0)}
						onChange={(v) => {
							onSave({ content: { ssrcProps: { artFillSource: v } } })
						}}
						allowUndefined={false}
						caps={[0, Number.POSITIVE_INFINITY]}
					/>
				</div>
				<div className="setting">
					<IntInput
						label="Art Cut (Key) Source"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.ssrcProps.artCutSource, 0)}
						onChange={(v) => {
							onSave({ content: { ssrcProps: { artCutSource: v } } })
						}}
						allowUndefined={false}
						caps={[0, Number.POSITIVE_INFINITY]}
					/>
				</div>
				<div className="setting">
					<SelectEnum
						label={'Art Option'}
						fullWidth
						{...inputValue(objs, (obj) => obj.content.ssrcProps.artOption, 0)}
						options={ATEMArtOption}
						onChange={(v: ATEMArtOption) => {
							onSave({ content: { ssrcProps: { artOption: v } } })
						}}
					/>
				</div>
				<div className="setting">
					<BooleanInput
						label="Art Pre-Multiplied"
						{...inputValue(objs, (obj) => obj.content.ssrcProps.artPreMultiplied, undefined)}
						onChange={(v) => {
							onSave({ content: { ssrcProps: { artPreMultiplied: v } } })
						}}
					/>
				</div>
				{isIndeterminate(objs, (obj) => obj.content.ssrcProps.artPreMultiplied) ? (
					<>-- Different values -- </>
				) : (
					firstObj.content.ssrcProps.artPreMultiplied === false && (
						<>
							<div className="setting">
								<IntInput
									label="Art Clip (0 - 1000)"
									fullWidth
									{...inputValue(objs, (obj) => (obj.content.ssrcProps as any).artClip, 0)}
									onChange={(v) => {
										if (firstObj.content.ssrcProps.artPreMultiplied) return
										onSave({ content: { ssrcProps: { artClip: v } } })
									}}
									allowUndefined={false}
									caps={[0, 1000]}
								/>
							</div>
							<div className="setting">
								<IntInput
									label="Art Gain (0 - 1000)"
									fullWidth
									{...inputValue(objs, (obj) => (obj.content.ssrcProps as any).artGain, 0)}
									onChange={(v) => {
										if (firstObj.content.ssrcProps.artPreMultiplied) return
										onSave({ content: { ssrcProps: { artGain: v } } })
									}}
									allowUndefined={false}
									caps={[0, 1000]}
								/>
							</div>
							<div className="setting">
								<BooleanInput
									label="Art Invert Key"
									{...inputValue(
										objs,
										(obj) => (obj.content.ssrcProps as any).artInvertKey,
										undefined
									)}
									onChange={(v) => {
										if (firstObj.content.ssrcProps.artPreMultiplied) return
										onSave({ content: { ssrcProps: { artInvertKey: v } } })
									}}
								/>
							</div>
						</>
					)
				)}
				<div className="setting">
					<BooleanInput
						label="Border Enabled"
						{...inputValue(objs, (obj) => obj.content.ssrcProps.borderEnabled, undefined)}
						onChange={(v) => {
							onSave({ content: { ssrcProps: { borderEnabled: v } } })
						}}
					/>
				</div>

				{isIndeterminate(objs, (obj) => obj.content.ssrcProps.borderEnabled) ? (
					<>-- Different values -- </>
				) : (
					firstObj.content.ssrcProps.borderEnabled && (
						<>
							<div className="setting">
								<SelectEnum
									label="Border Bevel"
									fullWidth
									{...inputValue(objs, (obj) => (obj.content.ssrcProps as any).borderBevel, 0)}
									options={ATEMBorderBevel}
									onChange={(v) => {
										if (!firstObj.content.ssrcProps.borderEnabled) return
										onSave({ content: { ssrcProps: { borderBevel: v } } })
									}}
									allowUndefined={false}
								/>
							</div>
							<div className="setting">
								<IntInput
									label="Border Outer Width (0 - 1600)"
									fullWidth
									{...inputValue(objs, (obj) => (obj.content.ssrcProps as any).borderOuterWidth, 0)}
									onChange={(v) => {
										if (!firstObj.content.ssrcProps.borderEnabled) return
										onSave({ content: { ssrcProps: { borderOuterWidth: v } } })
									}}
									allowUndefined={false}
									caps={[0, 1600]}
								/>
							</div>
							<div className="setting">
								<IntInput
									label="Border Inner Width (0 - 1600)"
									fullWidth
									{...inputValue(objs, (obj) => (obj.content.ssrcProps as any).borderInnerWidth, 0)}
									onChange={(v) => {
										if (!firstObj.content.ssrcProps.borderEnabled) return
										onSave({ content: { ssrcProps: { borderInnerWidth: v } } })
									}}
									allowUndefined={false}
									caps={[0, 1600]}
								/>
							</div>
							<div className="setting">
								<IntInput
									label="Border Outer Softness (0 - 100)"
									fullWidth
									{...inputValue(
										objs,
										(obj) => (obj.content.ssrcProps as any).borderOuterSoftness,
										0
									)}
									onChange={(v) => {
										if (!firstObj.content.ssrcProps.borderEnabled) return

										onSave({ content: { ssrcProps: { borderOuterSoftness: v } } })
									}}
									allowUndefined={false}
									caps={[0, 100]}
								/>
							</div>
							<div className="setting">
								<IntInput
									label="Border Inner Softness (0 - 100)"
									fullWidth
									{...inputValue(
										objs,
										(obj) => (obj.content.ssrcProps as any).borderInnerSoftness,
										0
									)}
									onChange={(v) => {
										if (!firstObj.content.ssrcProps.borderEnabled) return
										onSave({ content: { ssrcProps: { borderInnerSoftness: v } } })
									}}
									allowUndefined={false}
									caps={[0, 100]}
								/>
							</div>
							<div className="setting">
								<IntInput
									label="Border Bevel Softness (0 - 100)"
									fullWidth
									{...inputValue(
										objs,
										(obj) => (obj.content.ssrcProps as any).borderBevelSoftness,
										0
									)}
									onChange={(v) => {
										if (!firstObj.content.ssrcProps.borderEnabled) return
										onSave({ content: { ssrcProps: { borderBevelSoftness: v } } })
									}}
									allowUndefined={false}
									caps={[0, 100]}
								/>
							</div>
							<div className="setting">
								<IntInput
									label="Border Bevel Position (0 - 100)"
									fullWidth
									{...inputValue(
										objs,
										(obj) => (obj.content.ssrcProps as any).borderBevelPosition,
										0
									)}
									onChange={(v) => {
										if (!firstObj.content.ssrcProps.borderEnabled) return
										onSave({ content: { ssrcProps: { borderBevelPosition: v } } })
									}}
									allowUndefined={false}
									caps={[0, 100]}
								/>
							</div>
							<div className="setting">
								<IntInput
									label="Border Hue (0 - 3599)"
									fullWidth
									{...inputValue(objs, (obj) => (obj.content.ssrcProps as any).borderHue, 0)}
									onChange={(v) => {
										if (!firstObj.content.ssrcProps.borderEnabled) return
										onSave({ content: { ssrcProps: { borderHue: v } } })
									}}
									allowUndefined={false}
									caps={[0, 3599]}
								/>
							</div>
							<div className="setting">
								<IntInput
									label="Border Saturation (0 - 1000)"
									fullWidth
									{...inputValue(objs, (obj) => (obj.content.ssrcProps as any).borderSaturation, 0)}
									onChange={(v) => {
										if (!firstObj.content.ssrcProps.borderEnabled) return
										onSave({ content: { ssrcProps: { borderSaturation: v } } })
									}}
									allowUndefined={false}
									caps={[0, 1000]}
								/>
							</div>
							<div className="setting">
								<IntInput
									label="Border Luma (0 - 1000)"
									fullWidth
									{...inputValue(objs, (obj) => (obj.content.ssrcProps as any).borderLuma, 0)}
									onChange={(v) => {
										if (!firstObj.content.ssrcProps.borderEnabled) return
										onSave({ content: { ssrcProps: { borderLuma: v } } })
									}}
									allowUndefined={false}
									caps={[0, 1000]}
								/>
							</div>
							<div className="setting">
								<IntInput
									label="Border Light Source Direction (0 - 3590)"
									fullWidth
									{...inputValue(
										objs,
										(obj) => (obj.content.ssrcProps as any).borderLightSourceDirection,
										0
									)}
									onChange={(v) => {
										if (!firstObj.content.ssrcProps.borderEnabled) return
										onSave({ content: { ssrcProps: { borderLightSourceDirection: v } } })
									}}
									allowUndefined={false}
									caps={[0, 3590]}
								/>
							</div>
							<div className="setting">
								<IntInput
									label="Border Light Source Altitude (10 - 100)"
									fullWidth
									{...inputValue(
										objs,
										(obj) => (obj.content.ssrcProps as any).borderLightSourceAltitude,
										0
									)}
									onChange={(v) => {
										if (!firstObj.content.ssrcProps.borderEnabled) return
										onSave({ content: { ssrcProps: { borderLightSourceAltitude: v } } })
									}}
									allowUndefined={false}
									caps={[10, 100]}
								/>
							</div>
						</>
					)
				)}
			</>
		)
	} else if (contentType === TimelineContentTypeAtem.MEDIAPLAYER) {
		const objs = objs0 as TimelineObjAtemMediaPlayer[]
		const firstObj = objs[0]
		if (!firstObj) return null

		const onSave = onSave0 as OnSaveType<TimelineObjAtemMediaPlayer>

		settings = (
			<>
				<div className="setting">
					<SelectEnum
						label={'Source Type'}
						fullWidth
						{...inputValue(objs, (obj) => obj.content.mediaPlayer.sourceType, undefined)}
						options={MediaSourceType}
						onChange={(v) => {
							onSave({ content: { mediaPlayer: { sourceType: v } } })
						}}
						allowUndefined={true}
					/>
				</div>
				<div className="setting">
					<IntInput
						label="Clip Index"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.mediaPlayer.clipIndex, 0)}
						onChange={(v) => {
							onSave({ content: { mediaPlayer: { clipIndex: v } } })
						}}
						allowUndefined={false}
						caps={[0, Number.POSITIVE_INFINITY]}
					/>
				</div>
				<div className="setting">
					<IntInput
						label="Still Index"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.mediaPlayer.stillIndex, 0)}
						onChange={(v) => {
							onSave({ content: { mediaPlayer: { stillIndex: v } } })
						}}
						allowUndefined={false}
						caps={[0, Number.POSITIVE_INFINITY]}
					/>
				</div>
				<div className="setting">
					<BooleanInput
						label="Playing"
						{...inputValue(objs, (obj) => obj.content.mediaPlayer.playing, undefined)}
						onChange={(v) => {
							onSave({ content: { mediaPlayer: { playing: v } } })
						}}
					/>
				</div>
				<div className="setting">
					<BooleanInput
						label="Loop"
						{...inputValue(objs, (obj) => obj.content.mediaPlayer.loop, undefined)}
						onChange={(v) => {
							onSave({ content: { mediaPlayer: { loop: v } } })
						}}
					/>
				</div>
				<div className="setting">
					<BooleanInput
						label="At Beginning"
						{...inputValue(objs, (obj) => obj.content.mediaPlayer.atBeginning, undefined)}
						onChange={(v) => {
							onSave({ content: { mediaPlayer: { atBeginning: v } } })
						}}
					/>
				</div>
				<div className="setting">
					<IntInput
						label="Clip Frame"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.mediaPlayer.clipFrame, 0)}
						onChange={(v) => {
							onSave({ content: { mediaPlayer: { clipFrame: v } } })
						}}
						allowUndefined={false}
						caps={[0, Number.POSITIVE_INFINITY]}
					/>
				</div>
			</>
		)
	} else if (contentType === TimelineContentTypeAtem.MACROPLAYER) {
		const objs = objs0 as TimelineObjAtemMacroPlayer[]
		const firstObj = objs[0]
		if (!firstObj) return null
		const onSave = onSave0 as OnSaveType<TimelineObjAtemMacroPlayer>
		settings = (
			<>
				<div className="setting">
					<IntInput
						label="Macro Index"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.macroPlayer.macroIndex, 0)}
						onChange={(v) => {
							onSave({ content: { macroPlayer: { macroIndex: v } } })
						}}
						allowUndefined={false}
						caps={[0, Number.POSITIVE_INFINITY]}
					/>
				</div>
				<div className="setting">
					<BooleanInput
						label="Macro Player isRunning"
						{...inputValue(objs, (obj) => obj.content.macroPlayer.isRunning, undefined)}
						onChange={(v) => {
							onSave({ content: { macroPlayer: { isRunning: v } } })
						}}
					/>
				</div>
				<div className="setting">
					<BooleanInput
						label="Macro Loop"
						{...inputValue(objs, (obj) => obj.content.macroPlayer.loop, undefined)}
						onChange={(v) => {
							onSave({ content: { macroPlayer: { loop: v } } })
						}}
					/>
				</div>
			</>
		)
	} else if (contentType === TimelineContentTypeAtem.AUDIOCHANNEL) {
		const objs = objs0 as TimelineObjAtemAudioChannel[]
		const firstObj = objs[0]
		if (!firstObj) return null
		const onSave = onSave0 as OnSaveType<TimelineObjAtemAudioChannel>
		settings = (
			<>
				<div className="setting">
					<IntInput
						label="Gain (0 - 65381)"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.audioChannel.gain, 0)}
						onChange={(v) => {
							onSave({ content: { audioChannel: { gain: v } } })
						}}
						allowUndefined={true}
						caps={[0, 65381]}
					/>
				</div>
				<div className="setting">
					<IntInput
						label="Balance (-10000 - 10000)"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.audioChannel.balance, 0)}
						onChange={(v) => {
							onSave({ content: { audioChannel: { balance: v } } })
						}}
						allowUndefined={true}
						caps={[-10000, 10000]}
					/>
				</div>
				<div className="setting">
					<SelectEnum
						label="Mix Option"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.audioChannel.mixOption, 0)}
						options={ATEMAudioChannelMixOption}
						onChange={(v) => {
							onSave({ content: { audioChannel: { mixOption: v } } })
						}}
						allowUndefined={true}
					/>
				</div>
			</>
		)
	} else {
		assertNever(contentType)
	}

	return (
		<EditWrapper objs={objs} onSave={onSave0}>
			{settings}
		</EditWrapper>
	)
}
