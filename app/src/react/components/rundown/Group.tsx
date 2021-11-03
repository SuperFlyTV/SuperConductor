import React from 'react'
import Toggle from '@atlaskit/toggle'
import { IToggleGroupLoop, TOGGLE_GROUP_LOOP_CHANNEL } from '@/ipc/channels'
const { ipcRenderer } = window.require('electron')

type PropsType = {
	children: React.ReactNode
	loop: boolean
	id: string
}

export const Group = (props: PropsType) => {
	return (
		<div className="group">
			<div className="group__header">
				<div className="title">Group #1</div>
				<div className="controls">
					<div className="toggle">
						<Toggle
							id="loop"
							isChecked={props.loop}
							onChange={() => {
								const data: IToggleGroupLoop = { groupId: props.id, value: !props.loop }
								ipcRenderer.send(TOGGLE_GROUP_LOOP_CHANNEL, data)
							}}
						/>
						<label htmlFor="loop" className="toggle-label">
							Loop
						</label>
					</div>
				</div>
			</div>
			<div className="group__content">{props.children}</div>
		</div>
	)
}
