import { assertNever } from '@shared/lib'
import React from 'react'
import {
	TimelineContentTypeHyperdeck,
	TimelineObjHyperdeckAny,
	TimelineObjHyperdeckTransport,
	TransportStatus,
} from 'timeline-state-resolver-types'
import { BooleanInput } from '../../../inputs/BooleanInput'
import { IntInput } from '../../../inputs/IntInput'
import { SelectEnum } from '../../../inputs/SelectEnum'
import { TextInput } from '../../../inputs/TextInput'
import { EditWrapper, NOT_IMPLEMENTED_SETTINGS, OnSave } from './lib'

/**
 * In TSR, only some of the transport statuses are supported and actually do something.
 * To prevent user confusion, we only allow them to pick from the statuses that TSR actually supports.
 * The downside of this is that if TSR gains support for other statuses, this enum will have to be
 * updated by hand.
 */
enum SupportedTransportStatuses {
	PLAY = 'play',
	RECORD = 'record',
	STOPPED = 'stopped',
	PREVIEW = 'preview',
}

export const EditTimelineObjHyperdeckAny: React.FC<{ obj: TimelineObjHyperdeckAny; onSave: OnSave }> = ({
	obj,
	onSave,
}) => {
	let settings: JSX.Element = <></>

	const commonSettings: JSX.Element = (
		<>
			<div className="setting">
				<SelectEnum
					label="Type"
					fullWidth
					currentValue={obj.content.type}
					options={TimelineContentTypeHyperdeck}
					onChange={(v: TimelineContentTypeHyperdeck) => {
						obj.content.type = v
						onSave(obj)
					}}
					allowUndefined={false}
				/>
			</div>
		</>
	)

	const obj0 = obj

	if (obj.content.type === TimelineContentTypeHyperdeck.TRANSPORT) {
		const obj = obj0 as TimelineObjHyperdeckTransport
		let specificTransportSettings: JSX.Element = <></>
		const commonTransportSettings: JSX.Element = (
			<>
				<div className="setting">
					<SelectEnum
						label="Transport Status"
						fullWidth
						currentValue={obj.content.status}
						options={SupportedTransportStatuses}
						onChange={(v: TransportStatus) => {
							obj.content.status = v
							onSave(obj)
						}}
						allowUndefined={false}
					/>
				</div>
			</>
		)

		if (
			obj.content.status === TransportStatus.FORWARD ||
			obj.content.status === TransportStatus.REWIND ||
			obj.content.status === TransportStatus.JOG ||
			obj.content.status === TransportStatus.SHUTTLE
		) {
			specificTransportSettings = <>{NOT_IMPLEMENTED_SETTINGS}</>
		} else if (obj.content.status === TransportStatus.STOPPED) {
			specificTransportSettings = <></>
		} else if (obj.content.status === TransportStatus.PREVIEW) {
			specificTransportSettings = <></>
		} else if (obj.content.status === TransportStatus.PLAY) {
			specificTransportSettings = (
				<>
					<div className="setting">
						<IntInput
							label="Clip ID"
							fullWidth
							currentValue={obj.content.clipId ?? undefined}
							onChange={(v) => {
								if (obj.content.status !== TransportStatus.PLAY) {
									return
								}
								obj.content.clipId = v === undefined ? null : v
								onSave(obj)
							}}
							allowUndefined={true}
							caps={[1, Number.POSITIVE_INFINITY]}
						/>
					</div>
					<div className="setting">
						<IntInput
							label="Speed"
							fullWidth
							currentValue={obj.content.speed}
							onChange={(v) => {
								if (obj.content.status !== TransportStatus.PLAY) {
									return
								}
								obj.content.speed = v
								onSave(obj)
							}}
							allowUndefined={true}
							caps={[-5000, 5000]}
						/>
					</div>
					<div className="setting">
						<BooleanInput
							label="Loop"
							currentValue={obj.content.loop}
							onChange={(v) => {
								if (obj.content.status !== TransportStatus.PLAY) {
									return
								}
								obj.content.loop = v
								onSave(obj)
							}}
						/>
					</div>
					<div className="setting">
						<BooleanInput
							label="Single Clip"
							currentValue={obj.content.singleClip}
							onChange={(v) => {
								if (obj.content.status !== TransportStatus.PLAY) {
									return
								}
								obj.content.singleClip = v
								onSave(obj)
							}}
						/>
					</div>
				</>
			)
		} else if (obj.content.status === TransportStatus.RECORD) {
			specificTransportSettings = (
				<>
					<div className="setting">
						<TextInput
							label="Filename"
							fullWidth
							currentValue={obj.content.recordFilename}
							onChange={(v) => {
								if (obj.content.status !== TransportStatus.RECORD) {
									return
								}
								obj.content.recordFilename = v
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

		settings = (
			<>
				{commonTransportSettings}
				{specificTransportSettings}
			</>
		)
	}

	return (
		<EditWrapper obj={obj} onSave={onSave}>
			{commonSettings}
			{settings}
		</EditWrapper>
	)
}
