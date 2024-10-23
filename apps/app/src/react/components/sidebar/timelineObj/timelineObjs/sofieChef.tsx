import { assertNever } from '@shared/lib'
import React from 'react'
import {
	TSRTimelineObj,
	TimelineContentSofieChefAny,
	TimelineContentTypeSofieChef,
} from 'timeline-state-resolver-types'
import { firstValue, inputValue } from '../../../../lib/multipleEdit.js'
import { SelectEnum } from '../../../inputs/SelectEnum.js'
import { TextInput } from '../../../inputs/TextInput.js'
import { EditWrapper, OnSave, OnSaveType } from './lib.js'

export const EditTimelineObjSofieChefAny: React.FC<{
	objs: TSRTimelineObj<TimelineContentSofieChefAny>[]
	onSave: OnSave
}> = ({ objs, onSave: onSave0 }) => {
	const onSave = onSave0 as OnSaveType<TSRTimelineObj<TimelineContentSofieChefAny>>
	let settings: JSX.Element = <></>

	const contentType = firstValue(objs, (obj) => obj.content.type)
	if (!contentType) return null

	if (contentType === TimelineContentTypeSofieChef.URL) {
		settings = (
			<>
				<div className="setting">
					<TextInput
						label="URL"
						fullWidth
						{...inputValue(objs, (obj) => obj.content.url, '')}
						onChange={(v) => {
							onSave({ content: { url: v } })
						}}
						allowUndefined={false}
					/>
				</div>
			</>
		)
	} else {
		assertNever(contentType)
	}

	return (
		<EditWrapper objs={objs} onSave={onSave0}>
			<div className="setting">
				<SelectEnum
					label="Type"
					fullWidth
					{...inputValue(objs, (obj) => obj.content.type, '')}
					options={TimelineContentTypeSofieChef}
					onChange={(newValue) => {
						onSave({ content: { type: newValue } })
					}}
				/>
			</div>
			{settings}
		</EditWrapper>
	)
}
