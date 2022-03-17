import React from 'react'
import {
	TimelineContentTypeOBS,
	TimelineObjOBSAny,
	TimelineObjOBSCurrentScene,
	TimelineObjOBSCurrentTransition,
} from 'timeline-state-resolver-types'
import { TextInput } from '../../../inputs/TextInput'
import { EditWrapper, NOT_IMPLEMENTED_SETTINGS, OnSave } from './lib'

export const EditTimelineObjOBSAny: React.FC<{ obj: TimelineObjOBSAny; onSave: OnSave }> = ({ obj, onSave }) => {
	let settings: JSX.Element = <></>

	const obj0 = obj
	if (obj.content.type === TimelineContentTypeOBS.CURRENT_SCENE) {
		const obj = obj0 as TimelineObjOBSCurrentScene
		settings = (
			<>
				<div className="setting">
					<TextInput
						label="Scene Name"
						currentValue={obj.content.sceneName}
						onChange={(v) => {
							obj.content.sceneName = v
							onSave(obj)
						}}
						allowUndefined={false}
					/>
				</div>
			</>
		)
	} else if (obj.content.type === TimelineContentTypeOBS.CURRENT_TRANSITION) {
		const obj = obj0 as TimelineObjOBSCurrentTransition
		settings = (
			<>
				<div className="setting">
					<TextInput
						label="Transition Name"
						currentValue={obj.content.transitionName}
						onChange={(v) => {
							obj.content.transitionName = v
							onSave(obj)
						}}
						allowUndefined={false}
					/>
				</div>
			</>
		)
	} else {
		settings = NOT_IMPLEMENTED_SETTINGS
	}

	return (
		<EditWrapper obj={obj} onSave={onSave}>
			{settings}
		</EditWrapper>
	)
}
