import React, { useEffect, useMemo, useRef, useState } from 'react'
import Toggle from '@atlaskit/toggle'
import {
	DELETE_GROUP_CHANNEL,
	IDeleteGroup,
	INewRundown,
	IToggleAutoPlayLoop,
	IToggleGroupLoop,
	NEW_RUNDOWN_CHANNEL,
	STOP_GROUP_CHANNEL,
	TOGGLE_GROUP_AUTOPLAY_CHANNEL,
	TOGGLE_GROUP_LOOP_CHANNEL,
} from '@/ipc/channels'
import { TrashBtn } from '../inputs/TrashBtn'
import { GroupModel } from '@/models/GroupModel'
import { RundownView } from './Rundown'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import { Popup } from '../popup/Popup'
import { FormRow } from '../sidebar/DataRow'
import { getGroupPlayhead, GroupPlayhead, GroupPreparedPlayheadData, prepareGroupPlayhead } from '@/lib/playhead'
import { PlayControlBtn } from '../inputs/PlayControlBtn'
const { ipcRenderer } = window.require('electron')

export const GroupView: React.FC<{ group: GroupModel; selectedTimelineObjId: string | undefined }> = ({
	group,
	selectedTimelineObjId,
}) => {
	const playheadData = useRef<GroupPreparedPlayheadData | null>(null)
	useEffect(() => {
		playheadData.current = prepareGroupPlayhead(group)
	}, [group])

	const [playhead, setPlayhead] = useState<GroupPlayhead | null>(null)
	const requestRef = useRef<number>(0)
	const updatePlayhead = () => {
		setPlayhead(getGroupPlayhead(playheadData.current))
		requestRef.current = window.requestAnimationFrame(updatePlayhead)
	}
	useEffect(() => {
		requestRef.current = window.requestAnimationFrame(updatePlayhead)
		return () => {
			window.cancelAnimationFrame(requestRef.current)
		}
	}, [])

	const getRundownPlayhead = (rundownId: string): number | null => {
		if (!playhead) return null
		if (playhead.rundownId === rundownId) return playhead.time
		return null
	}
	const handleStop = () => {
		ipcRenderer.send(STOP_GROUP_CHANNEL, { groupId: group.id })
	}

	if (group.transparent) {
		const firstRundown = group.rundowns[0]
		return firstRundown ? (
			<RundownView
				selectedTimelineObjId={selectedTimelineObjId}
				rundown={firstRundown}
				parentGroup={group}
				playheadTime={getRundownPlayhead(firstRundown.id)}
			/>
		) : null
	} else {
		return (
			<div className="group">
				<div className="group__header">
					<div className="title">{group.name}</div>
					<div className="controls">
						<div className="toggle">
							<Toggle
								id="auto-play"
								isChecked={group.autoPlay}
								onChange={() => {
									const data: IToggleAutoPlayLoop = { groupId: group.id, value: !group.autoPlay }
									ipcRenderer.send(TOGGLE_GROUP_AUTOPLAY_CHANNEL, data)
								}}
							/>
							<label htmlFor="auto-play" className="toggle-label">
								Auto-play
							</label>
						</div>

						<div className="toggle">
							<Toggle
								id="loop"
								isChecked={group.loop}
								onChange={() => {
									const data: IToggleGroupLoop = { groupId: group.id, value: !group.loop }
									ipcRenderer.send(TOGGLE_GROUP_LOOP_CHANNEL, data)
								}}
							/>
							<label htmlFor="loop" className="toggle-label">
								Loop
							</label>
						</div>
						<TrashBtn
							onClick={() => {
								const data: IDeleteGroup = { groupId: group.id }
								ipcRenderer.send(DELETE_GROUP_CHANNEL, data)
							}}
						/>
						{playhead && <PlayControlBtn mode={'stop'} onClick={handleStop} />}
					</div>
				</div>
				<div className="group__content">
					{group.rundowns.map((rundown) => (
						<RundownView
							key={rundown.id}
							selectedTimelineObjId={selectedTimelineObjId}
							rundown={rundown}
							parentGroup={group}
							playheadTime={getRundownPlayhead(rundown.id)}
						/>
					))}

					<GroupOptions group={group} />
				</div>
			</div>
		)
	}
}

const GroupOptions: React.FC<{ group: GroupModel }> = (props) => {
	const [newRundownOpen, setNewRundownOpen] = React.useState(false)

	return (
		<>
			<div className="group-list__control-row">
				<button className="btn form" onClick={() => setNewRundownOpen(true)}>
					New rundown
				</button>
			</div>
			{newRundownOpen && (
				<Popup onClose={() => setNewRundownOpen(false)}>
					<Formik
						initialValues={{ name: '' }}
						enableReinitialize={true}
						onSubmit={(values) => {
							const data: INewRundown = {
								name: values.name,
								groupId: props.group.id,
							}

							ipcRenderer.send(NEW_RUNDOWN_CHANNEL, data)
							setNewRundownOpen(false)
						}}
					>
						{(formik) => (
							<Form>
								<FormRow>
									<label htmlFor="name">Name</label>
									<Field id="name" name="name" placeholder="Rundown name" />
									<ErrorMessage name="name" component="div" />
								</FormRow>
								<div className="btn-row-right">
									<button type="submit" className="btn form">
										Create
									</button>
								</div>
							</Form>
						)}
					</Formik>
				</Popup>
			)}
		</>
	)
}
