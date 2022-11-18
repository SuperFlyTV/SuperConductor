import { assertNever } from '@shared/lib'
import React from 'react'
import {
	TimelineContentTypeSofieChef,
	TimelineObjSofieChefAny,
	TimelineObjSofieChefScene,
} from 'timeline-state-resolver-types'
import { SelectEnum } from '../../../inputs/SelectEnum'
import { TextInput } from '../../../inputs/TextInput'
import { EditWrapper, OnSave } from './lib'

export const EditTimelineObjSofieChefAny: React.FC<{ obj: TimelineObjSofieChefAny; onSave: OnSave }> = ({
	obj,
	onSave,
}) => {
	let settings: JSX.Element = <></>

	if (obj.content.type === TimelineContentTypeSofieChef.URL) {
		const typedObj = obj as TimelineObjSofieChefScene
		settings = (
			<>
				<div className="setting">
					<TextInput
						label="URL"
						fullWidth
						currentValue={typedObj.content.url}
						onChange={(v) => {
							typedObj.content.url = v
							onSave(obj)
						}}
						allowUndefined={false}
					/>
				</div>
			</>
		)
	} else {
		assertNever(obj.content.type)
	}

	return (
		<EditWrapper obj={obj} onSave={onSave}>
			<div className="setting">
				<SelectEnum
					label="Type"
					fullWidth
					currentValue={obj.content.type}
					options={TimelineContentTypeSofieChef}
					onChange={(newValue) => {
						obj.content.type = newValue
						onSave(obj)
					}}
				/>
			</div>
			{settings}
		</EditWrapper>
	)
}
