import React from 'react'
import { TimelineEnable } from 'superfly-timeline'
import { TSRTimelineObj } from 'timeline-state-resolver-types'
import { DurationInput } from '../timelineObj/input/duration'

export const EditTimelineObj: React.FC<{
	obj: TSRTimelineObj
}> = ({ obj }) => {
	const enable: TimelineEnable = Array.isArray(obj.enable) ? obj.enable[0] : obj.enable

	// For now, we'll only support numbers:
	const start: number = Number(enable.start) || 0
	const duration: number = Number(enable.duration) || 0

	const onSave = (obj: TSRTimelineObj) => {}

	return (
		<div>
			<div className="edit-timeline-obj">
				<div className="settings">
					<div className="setting">
						<label>Start Time</label>

						<DurationInput
							currentValue={start}
							onChange={(newValue) => {
								if (!Array.isArray(obj.enable)) obj.enable.start = newValue
								onSave(obj)
							}}
							allowUndefined={false}
						/>
					</div>
					<div className="setting">
						<label>Duration</label>

						<DurationInput
							currentValue={duration}
							onChange={(newValue) => {
								if (!Array.isArray(obj.enable)) obj.enable.duration = newValue
								onSave(obj)
							}}
							allowUndefined={false}
						/>
					</div>
				</div>
			</div>
		</div>
	)
}
