import React from 'react'
import {
	TSRTimelineObj,
	TimelineContentTriCasterAny,
	TimelineContentTriCasterAudioChannel,
	TimelineContentTriCasterDSK,
	TimelineContentTriCasterInput,
	TimelineContentTriCasterME,
	TimelineContentTriCasterMatrixOutput,
	TimelineContentTriCasterMixOutput,
	TimelineContentTypeTriCaster,
	TriCasterMatrixOutputSource,
	TriCasterMixEffectInMixMode,
	TriCasterMixOutputSource,
} from 'timeline-state-resolver-types'
import { EditWrapper, NOT_IMPLEMENTED_SETTINGS, OnSave, OnSaveType } from './lib.js'
import { firstValue, inputValue, isIndeterminate } from '../../../../lib/multipleEdit.js'
import { TextInput } from '../../../inputs/TextInput.js'
import { assertNever } from '@shared/lib'
import { SelectEnum } from '../../../inputs/SelectEnum.js'
import { FloatInput } from '../../../inputs/FloatInput.js'
import { BooleanInput } from '../../../inputs/BooleanInput.js'

const TRANSITION_EFFECTS = [
	{ value: 'cut', label: 'Cut' },
	{ value: 'fade', label: 'Fade' },
	{ value: 2, label: 'Effect 2' },
	{ value: 3, label: 'Effect 3' },
	{ value: 4, label: 'Effect 4' },
	{ value: 5, label: 'Effect 5' },
	{ value: 6, label: 'Effect 6' },
	{ value: 7, label: 'Effect 7' },
	{ value: 8, label: 'Effect 8' },
]

export const EditTimelineObjTriCasterAny: React.FC<{
	objs: TSRTimelineObj<TimelineContentTriCasterAny>[]
	onSave: OnSave
}> = ({ objs, onSave: onSave0 }) => {
	const onSave = onSave0 as OnSaveType<TSRTimelineObj<TimelineContentTriCasterAny>>
	let settings: JSX.Element = NOT_IMPLEMENTED_SETTINGS

	const contentType = firstValue(objs, (obj) => obj.content.type)
	if (!contentType) return null

	if (isIndeterminate(objs, (obj) => obj.content.type)) {
		return <>-- Different types --</>
	}

	const objs0 = objs
	if (contentType === TimelineContentTypeTriCaster.ME) {
		const objs = objs0 as TSRTimelineObj<TimelineContentTriCasterME>[]
		const firstObj = objs[0]
		if (!firstObj) return null
		settings = (
			<>
				<div className="setting">
					<TextInput
						label="Source"
						fullWidth
						{...inputValue(
							objs,
							(obj) => (obj.content.me as TriCasterMixEffectInMixMode).programInput,
							'input1'
						)}
						onChange={(v) => {
							onSave({ content: { me: { programInput: v } } })
						}}
						allowUndefined={true}
					/>
				</div>
				<div className="setting">
					<SelectEnum
						label={'Transition'}
						fullWidth
						{...inputValue(objs, (obj) => obj.content.me.transitionEffect, undefined)}
						options={TRANSITION_EFFECTS} // TODO: check the numbers
						onChange={(v) => {
							onSave({ content: { me: { transitionEffect: v } } })
						}}
						allowUndefined={true}
					/>
				</div>
				<div className="setting">
					<FloatInput
						label={'Transition Duration'}
						fullWidth
						{...inputValue(
							objs,
							(obj) => (obj.content.me as TriCasterMixEffectInMixMode)?.transitionDuration,
							1
						)}
						onChange={(v) => {
							onSave({
								content: { me: { transitionDuration: v } },
							})
						}}
						allowUndefined={false}
						caps={[0, Number.POSITIVE_INFINITY]}
					/>
				</div>
			</>
		)
	} else if (contentType === TimelineContentTypeTriCaster.AUDIO_CHANNEL) {
		const objs = objs0 as TSRTimelineObj<TimelineContentTriCasterAudioChannel>[]
		const firstObj = objs[0]
		if (!firstObj) return null
		settings = (
			<>
				<div className="setting">
					<FloatInput
						label="Volume (dB)"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.audioChannel.volume, undefined)}
						onChange={(v) => {
							onSave({ content: { audioChannel: { volume: v } } })
						}}
						allowUndefined={true}
						// TODO: caps
					/>
				</div>
				<div className="setting">
					<BooleanInput
						label={'Muted'}
						{...inputValue(objs, (obj) => obj.content.audioChannel.isMuted, undefined)}
						onChange={(v) => {
							onSave({ content: { audioChannel: { isMuted: v } } })
						}}
					/>
				</div>
			</>
		)
	} else if (contentType === TimelineContentTypeTriCaster.DSK) {
		const objs = objs0 as TSRTimelineObj<TimelineContentTriCasterDSK>[]
		const firstObj = objs[0]
		if (!firstObj) return null
		settings = (
			<>
				<div className="setting">
					<TextInput
						label="Source"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.keyer.input, undefined)}
						onChange={(v) => {
							onSave({ content: { keyer: { input: v } } })
						}}
						allowUndefined={true}
					/>
				</div>
				<div className="setting">
					<BooleanInput
						label={'Muted'}
						{...inputValue(objs, (obj) => obj.content.keyer.onAir, false)}
						onChange={(v) => {
							onSave({ content: { keyer: { onAir: v } } })
						}}
					/>
				</div>
			</>
		)
	} else if (contentType === TimelineContentTypeTriCaster.INPUT) {
		const objs = objs0 as TSRTimelineObj<TimelineContentTriCasterInput>[]
		const firstObj = objs[0]
		if (!firstObj) return null
		settings = (
			<>
				<div className="setting">
					<TextInput
						label="Source"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.input.videoSource, undefined)}
						onChange={(v) => {
							onSave({ content: { input: { videoSource: v } } })
						}}
						allowUndefined={true}
					/>
				</div>
			</>
		)
	} else if (contentType === TimelineContentTypeTriCaster.MATRIX_OUTPUT) {
		const objs = objs0 as TSRTimelineObj<TimelineContentTriCasterMatrixOutput>[]
		const firstObj = objs[0]
		if (!firstObj) return null
		settings = (
			<>
				<div className="setting">
					<TextInput
						label="Source"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.source, undefined)}
						onChange={(v) => {
							onSave({ content: { source: v as TriCasterMatrixOutputSource | undefined } })
						}}
						allowUndefined={true}
					/>
				</div>
			</>
		)
	} else if (contentType === TimelineContentTypeTriCaster.MIX_OUTPUT) {
		const objs = objs0 as TSRTimelineObj<TimelineContentTriCasterMixOutput>[]
		const firstObj = objs[0]
		if (!firstObj) return null
		settings = (
			<>
				<div className="setting">
					<TextInput
						label="Source"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.source, undefined)}
						onChange={(v) => {
							onSave({ content: { source: v as TriCasterMixOutputSource | undefined } })
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
