import { assertNever } from '@shared/lib'
import React from 'react'
import { TimelineContentTypeSofieChef, TimelineObjSofieChefAny } from 'timeline-state-resolver-types'
import { SelectEnum } from '../../../inputs/SelectEnum'
import { TextInput } from '../../../inputs/TextInput'
import { EditTimelineObjProps, EditWrapper } from './lib'

export const EditTimelineObjSofieChefAny: React.FC<EditTimelineObjProps<TimelineObjSofieChefAny>> = (props) => {
	const { obj, onSave } = props
	let settings: JSX.Element = <></>

	if (obj.content.type === TimelineContentTypeSofieChef.URL) {
		settings = (
			<>
				<div className="setting">
					<TextInput
						label="URL"
						fullWidth
						currentValue={obj.content.url}
						onChange={(v) => {
							obj.content.url = v
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
		<EditWrapper {...props}>
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
