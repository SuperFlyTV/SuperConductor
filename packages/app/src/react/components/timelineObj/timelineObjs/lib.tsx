import React from 'react'
import { DeviceType, TSRTimelineObj } from 'timeline-state-resolver-types'
import { SelectEnum } from '../input/enum'

export type OnSave = (newObj: TSRTimelineObj) => void

export const EditWrapper: React.FC<{
	obj: TSRTimelineObj
	onSave: OnSave
}> = ({ obj, onSave, children }) => {
	return (
		<div className="edit-timeline-obj">
			<div className="settings">
				<div className="setting">
					<label>Device Type</label>

					<SelectEnum
						currentValue={obj.content.deviceType}
						options={DeviceType}
						onChange={(newValue) => {
							obj.content.deviceType = newValue
							onSave(obj)
						}}
					/>
				</div>
				{children}
			</div>
		</div>
	)
}

export const NOT_IMPLEMENTED_SETTINGS = (
	<div className="setting">
		<label>Not implemented</label>
		<div>
			<i>
				Support for this type of timeline object hasn&apos;t been implemented yet. Feel free to submit a pull
				request!
			</i>
		</div>
	</div>
)
