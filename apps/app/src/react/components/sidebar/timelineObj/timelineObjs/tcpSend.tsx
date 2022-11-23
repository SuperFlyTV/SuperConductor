import React from 'react'
import { IntInput } from '../../../inputs/IntInput'
import { TextInput } from '../../../inputs/TextInput'
import { TimelineObjTCPSendAny } from 'timeline-state-resolver-types'
import { EditWrapper, OnSave } from './lib'

export const EditTimelineObjTCPSendAny: React.FC<{ obj: TimelineObjTCPSendAny; onSave: OnSave }> = ({
	obj,
	onSave,
}) => {
	return (
		<EditWrapper obj={obj} onSave={onSave}>
			<div className="setting">
				<TextInput
					label="Message"
					fullWidth
					currentValue={obj.content.message}
					onChange={(v) => {
						obj.content.message = v
						onSave(obj)
					}}
					allowUndefined={false}
				/>
			</div>

			<div className="setting">
				<IntInput
					label="Temporal Priority"
					fullWidth
					currentValue={obj.content.temporalPriority}
					onChange={(v) => {
						obj.content.temporalPriority = v
						onSave(obj)
					}}
					allowUndefined={true}
				/>
			</div>

			<div className="setting">
				<TextInput
					label="Queue ID"
					fullWidth
					currentValue={obj.content.queueId}
					onChange={(v) => {
						obj.content.queueId = v
						onSave(obj)
					}}
					allowUndefined={true}
				/>
			</div>
		</EditWrapper>
	)
}
