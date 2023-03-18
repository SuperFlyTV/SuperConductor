import { assertNever } from '@shared/lib'
import React from 'react'
import { TimelineContentTypeHyperdeck, TimelineObjHyperdeckAny, TransportStatus } from 'timeline-state-resolver-types'
import { BooleanInput } from '../../../inputs/BooleanInput'
import { IntInput } from '../../../inputs/IntInput'
import { SelectEnum } from '../../../inputs/SelectEnum'
import { TextInput } from '../../../inputs/TextInput'
import { EditTimelineObjProps, EditWrapper, NOT_IMPLEMENTED_SETTINGS } from './lib'

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

export const EditTimelineObjHyperdeckAny: React.FC<EditTimelineObjProps<TimelineObjHyperdeckAny>> = (props) => {
	const { obj, onSave } = props
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

	if (obj.content.type === TimelineContentTypeHyperdeck.TRANSPORT) {
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

							// There isn't any runtime code which enforces that clipId is a number or null.
							// What this means is that, if a user first creates a RECORD object then
							// changes it to a PLAY object, it can have an undefined clipId which
							// can then propogate throughout the system, which won't be handled correctly by TSR.
							// To prevent this, we check for an undefined value and replace it with null here.
							if (
								obj.content.status === TransportStatus.PLAY &&
								(obj.content as any).clipId === undefined
							) {
								obj.content.clipId = null
							}

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
			obj.content.status === TransportStatus.SHUTTLE ||
			obj.content.status === TransportStatus.STOPPED
		) {
			specificTransportSettings = <>{NOT_IMPLEMENTED_SETTINGS}</>
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
		<EditWrapper {...props}>
			{commonSettings}
			{settings}
		</EditWrapper>
	)
}
