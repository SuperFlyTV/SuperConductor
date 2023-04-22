import { assertNever } from '@shared/lib'
import React from 'react'
import {
	TSRTimelineObj,
	TimelineContentHyperdeckAny,
	TimelineContentTypeHyperdeck,
	TransportStatus,
} from 'timeline-state-resolver-types'
import { isIndeterminate, inputValue, firstValue } from '../../../../lib/multipleEdit'
import { BooleanInput } from '../../../inputs/BooleanInput'
import { IntInput } from '../../../inputs/IntInput'
import { SelectEnum } from '../../../inputs/SelectEnum'
import { TextInput } from '../../../inputs/TextInput'
import { EditWrapper, NOT_IMPLEMENTED_SETTINGS, OnSave, OnSaveType } from './lib'

/**
 * In TSR, only some of the transport statuses are supported and actually do something.
 * To prevent user confusion, we only allow them to pick from the statuses that TSR actually supports.
 * The downside of this is that if TSR gains support for other statuses, this enum will have to be
 * updated by hand.
 */
enum SupportedTransportStatuses {
	PLAY = 'play',
	RECORD = 'record',
	PREVIEW = 'preview',
}

export const EditTimelineObjHyperdeckAny: React.FC<{
	objs: TSRTimelineObj<TimelineContentHyperdeckAny>[]
	onSave: OnSave
}> = ({ objs, onSave: onSave0 }) => {
	const onSave = onSave0 as OnSaveType<TSRTimelineObj<TimelineContentHyperdeckAny>>
	const firstObj = objs[0]
	if (!firstObj) return null

	const contentType = firstValue(objs, (obj) => obj.content.type)
	if (!contentType) return null

	let settings: JSX.Element = <></>

	const commonSettings: JSX.Element = (
		<>
			<div className="setting">
				<SelectEnum
					label="Type"
					fullWidth
					{...inputValue(objs, (obj) => obj.content.type, undefined)}
					options={TimelineContentTypeHyperdeck}
					onChange={(v: TimelineContentTypeHyperdeck) => {
						onSave({ content: { type: v } })
					}}
					allowUndefined={false}
				/>
			</div>
		</>
	)

	if (contentType === TimelineContentTypeHyperdeck.TRANSPORT) {
		let specificTransportSettings: JSX.Element = <></>
		const commonTransportSettings: JSX.Element = (
			<>
				<div className="setting">
					<SelectEnum
						label="Transport Status"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.status, undefined)}
						options={SupportedTransportStatuses}
						onChange={(v: TransportStatus) => {
							// There isn't any runtime code which enforces that clipId is a number or null.
							// What this means is that, if a user first creates a RECORD object then
							// changes it to a PLAY object, it can have an undefined clipId which
							// can then propogate throughout the system, which won't be handled correctly by TSR.
							// To prevent this, we check for an undefined value and replace it with null here.
							if (
								firstObj.content.status === TransportStatus.PLAY &&
								firstObj.content.clipId === undefined
							) {
								onSave({ content: { status: v, clipId: null } })
							} else {
								onSave({ content: { status: v } })
							}
						}}
						allowUndefined={false}
					/>
				</div>
			</>
		)

		if (isIndeterminate(objs, (obj) => obj.content.status)) {
			specificTransportSettings = <>-- Different statuses --</>
		} else if (
			firstObj.content.status === TransportStatus.FORWARD ||
			firstObj.content.status === TransportStatus.REWIND ||
			firstObj.content.status === TransportStatus.JOG ||
			firstObj.content.status === TransportStatus.SHUTTLE ||
			firstObj.content.status === TransportStatus.STOPPED
		) {
			specificTransportSettings = <>{NOT_IMPLEMENTED_SETTINGS}</>
		} else if (firstObj.content.status === TransportStatus.PREVIEW) {
			specificTransportSettings = <></>
		} else if (firstObj.content.status === TransportStatus.PLAY) {
			specificTransportSettings = (
				<>
					<div className="setting">
						<IntInput
							label="Clip ID"
							fullWidth
							{...inputValue(objs, (obj) => (obj.content as any).clipId, undefined)}
							onChange={(v) => {
								if (firstObj.content.status !== TransportStatus.PLAY) return
								onSave({ content: { clipId: v === undefined ? null : v } })
							}}
							allowUndefined={true}
							caps={[1, Number.POSITIVE_INFINITY]}
						/>
					</div>
					<div className="setting">
						<IntInput
							label="Speed"
							fullWidth
							{...inputValue(objs, (obj) => (obj.content as any).speed, undefined)}
							onChange={(v) => {
								if (firstObj.content.status !== TransportStatus.PLAY) return
								onSave({ content: { speed: v } })
							}}
							allowUndefined={true}
							caps={[-5000, 5000]}
						/>
					</div>
					<div className="setting">
						<BooleanInput
							label="Loop"
							{...inputValue(objs, (obj) => (obj.content as any).loop, undefined)}
							onChange={(v) => {
								if (firstObj.content.status !== TransportStatus.PLAY) return
								onSave({ content: { loop: v } })
							}}
						/>
					</div>
					<div className="setting">
						<BooleanInput
							label="Single Clip"
							{...inputValue(objs, (obj) => (obj.content as any).singleClip, undefined)}
							onChange={(v) => {
								if (firstObj.content.status !== TransportStatus.PLAY) return
								onSave({ content: { singleClip: v } })
							}}
						/>
					</div>
				</>
			)
		} else if (firstObj.content.status === TransportStatus.RECORD) {
			specificTransportSettings = (
				<>
					<div className="setting">
						<TextInput
							label="Filename"
							fullWidth
							{...inputValue(objs, (obj) => (obj.content as any).recordFilename, undefined)}
							onChange={(v) => {
								if (firstObj.content.status !== TransportStatus.RECORD) return
								onSave({ content: { recordFilename: v } })
							}}
							allowUndefined={true}
						/>
					</div>
				</>
			)
		} else {
			assertNever(firstObj.content)
		}

		settings = (
			<>
				{commonTransportSettings}
				{specificTransportSettings}
			</>
		)
	} else {
		assertNever(contentType)
	}

	return (
		<EditWrapper objs={objs} onSave={onSave0}>
			{commonSettings}
			{settings}
		</EditWrapper>
	)
}
