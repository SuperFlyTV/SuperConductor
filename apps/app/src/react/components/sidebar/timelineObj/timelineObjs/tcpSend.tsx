import React from 'react'
import { IntInput } from '../../../inputs/IntInput'
import { TextInput } from '../../../inputs/TextInput'
import { TimelineObjTCPSendAny } from 'timeline-state-resolver-types'
import { EditWrapper, OnSave } from './lib'
import { inputValue } from '../../../../lib/multipleEdit'

export const EditTimelineObjTCPSendAny: React.FC<{ objs: TimelineObjTCPSendAny[]; onSave: OnSave }> = ({
	objs,
	onSave,
}) => {
	return (
		<EditWrapper objs={objs} onSave={onSave}>
			<div className="setting">
				<TextInput
					label="Message"
					fullWidth
					{...inputValue(objs, (obj) => obj.content.message, '')}
					onChange={(v) => {
						onSave({ content: { message: v } })
					}}
					allowUndefined={false}
				/>
			</div>

			<div className="setting">
				<IntInput
					label="Temporal Priority"
					fullWidth
					{...inputValue(objs, (obj) => obj.content.temporalPriority, undefined)}
					onChange={(v) => {
						onSave({ content: { temporalPriority: v } })
					}}
					allowUndefined={true}
				/>
			</div>

			<div className="setting">
				<TextInput
					label="Queue ID"
					fullWidth
					{...inputValue(objs, (obj) => obj.content.queueId, undefined)}
					onChange={(v) => {
						onSave({ content: { queueId: v } })
					}}
					allowUndefined={true}
				/>
			</div>
		</EditWrapper>
	)
}
