import React from 'react'
import { TimelineObjAtemAny } from 'timeline-state-resolver-types'
import { EditWrapper, OnSave } from './lib'

export const EditTimelineObjAtemAny: React.FC<{ obj: TimelineObjAtemAny; onSave: OnSave }> = ({ obj, onSave }) => {
	return (
		<EditWrapper obj={obj} onSave={onSave}>
			<div className="setting">
				<label>Not implemented</label>
				<div>
					<i>
						Support for this type of timeline object hasn't been implemented yet. Feel free to submit a pull request!
					</i>
					<div>
						<pre>{JSON.stringify(obj.content, undefined, 2)}</pre>
					</div>
				</div>
			</div>
		</EditWrapper>
	)
}
