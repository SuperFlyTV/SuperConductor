import { assertNever } from '@shared/lib'
import React from 'react'
import {
	AtemTransitionStyle,
	TimelineContentTypeAtem,
	TimelineObjAtemAny,
	TimelineObjAtemAUX,
	TimelineObjAtemDSK,
	TimelineObjAtemME,
} from 'timeline-state-resolver-types'
import { BooleanInput } from '../../inputs/BooleanInput'
import { SelectEnum } from '../../inputs/SelectEnum'
import { IntInput } from '../../inputs/IntInput'
import { EditWrapper, NOT_IMPLEMENTED_SETTINGS, OnSave } from './lib'

export const EditTimelineObjAtemAny: React.FC<{ obj: TimelineObjAtemAny; onSave: OnSave }> = ({ obj, onSave }) => {
	let settings: JSX.Element = <></>

	const obj0 = obj
	if (obj.content.type === TimelineContentTypeAtem.ME) {
		const obj = obj0 as TimelineObjAtemME
		settings = (
			<>
				<div className="setting">
					<label>Input</label>
					<IntInput
						currentValue={obj.content.me.input}
						onChange={(v) => {
							obj.content.me.input = v
							onSave(obj)
						}}
						allowUndefined={true}
					/>
				</div>
				<div className="setting">
					<label>Transition</label>
					<SelectEnum
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
						<label>Transition: Mix Rate</label>
						<SelectEnum
							currentValue={obj.content.me.transitionSettings?.mix?.rate}
							options={AtemTransitionStyle}
							onChange={(v) => {
								if (!obj.content.me.transitionSettings) obj.content.me.transitionSettings = {}
								if (!obj.content.me.transitionSettings.mix)
									obj.content.me.transitionSettings.mix = { rate: v }

								obj.content.me.transitionSettings.mix.rate = v
								onSave(obj)
							}}
							allowUndefined={true}
						/>
					</div>
				) : obj.content.me.transition !== undefined ? (
					<>
						<div className="setting">
							<label>Transition: Rate</label>
							<SelectEnum
								currentValue={obj.content.me.transitionSettings?.wipe?.rate}
								options={AtemTransitionStyle}
								onChange={(v) => {
									if (!obj.content.me.transitionSettings) obj.content.me.transitionSettings = {}
									if (!obj.content.me.transitionSettings.wipe)
										obj.content.me.transitionSettings.wipe = {}

									obj.content.me.transitionSettings.wipe.rate = v
									onSave(obj)
								}}
								allowUndefined={true}
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
					<label>DSK onAir</label>
					<BooleanInput
						currentValue={obj.content.dsk.onAir}
						onChange={(v) => {
							obj.content.dsk.onAir = v
							onSave(obj)
						}}
					/>
				</div>
				<div className="setting">
					<label>DSK: Source Fill</label>
					<IntInput
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
					/>
				</div>

				<div className="setting">
					<label>DSK: Source Cut (key)</label>
					<IntInput
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
					<label>Input</label>
					<IntInput
						currentValue={obj.content.aux.input}
						onChange={(v) => {
							obj.content.aux.input = v
							onSave(obj)
						}}
						allowUndefined={false}
					/>
				</div>
			</>
		)
	} else if (obj.content.type === TimelineContentTypeAtem.SSRC) {
		// const obj = obj0 as TimelineObjAtemSsrc
		{
			/* Note: There are more options that could be implemented here, feel free to submit a PR! */
			NOT_IMPLEMENTED_SETTINGS
		}
	} else if (obj.content.type === TimelineContentTypeAtem.SSRCPROPS) {
		// const obj = obj0 as TimelineObjAtemSsrcProps
		{
			/* Note: There are more options that could be implemented here, feel free to submit a PR! */
			NOT_IMPLEMENTED_SETTINGS
		}
	} else if (obj.content.type === TimelineContentTypeAtem.MEDIAPLAYER) {
		// const obj = obj0 as TimelineObjAtemMediaPlayer
		{
			/* Note: There are more options that could be implemented here, feel free to submit a PR! */
			NOT_IMPLEMENTED_SETTINGS
		}
	} else if (obj.content.type === TimelineContentTypeAtem.MACROPLAYER) {
		// const obj = obj0 as TimelineObjAtemMacroPlayer
		{
			/* Note: There are more options that could be implemented here, feel free to submit a PR! */
			NOT_IMPLEMENTED_SETTINGS
		}
	} else if (obj.content.type === TimelineContentTypeAtem.AUDIOCHANNEL) {
		// const obj = obj0 as TimelineObjAtemAudioChannel
		{
			/* Note: There are more options that could be implemented here, feel free to submit a PR! */
			NOT_IMPLEMENTED_SETTINGS
		}
	} else {
		assertNever(obj.content)
	}

	return (
		<EditWrapper obj={obj} onSave={onSave}>
			{settings}
		</EditWrapper>
	)
}
