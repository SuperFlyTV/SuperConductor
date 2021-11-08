import React from 'react'
import Toggle from '@atlaskit/toggle'
import { DELETE_GROUP_CHANNEL, IDeleteGroup, IToggleGroupLoop, TOGGLE_GROUP_LOOP_CHANNEL } from '@/ipc/channels'
import { TrashBtn } from '../inputs/TrashBtn'
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
					<TrashBtn
						onClick={() => {
							const data: IDeleteGroup = { groupId: props.id }
							ipcRenderer.send(DELETE_GROUP_CHANNEL, data)
						}}
					/>
				</div>
			</div>
			<div className="group__content">{props.children}</div>
		</div>
	)
}
