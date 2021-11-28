import React, { useEffect, useRef, useState, useContext } from 'react'
import Toggle from '@atlaskit/toggle'
import { TrashBtn } from '../inputs/TrashBtn'
import { GroupModel } from '@/models/GroupModel'
import { RundownView } from './Rundown'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import { Popup } from '../popup/Popup'
import { FormRow } from '../sidebar/DataRow'
import { getGroupPlayhead, GroupPlayhead } from '@/lib/playhead'
import { GroupPreparedPlayheadData } from '@/models/PlayheadData'
import { IPCServerContext } from '@/react/App'

export const GroupView: React.FC<{ group: GroupModel }> = ({ group }) => {
	const ipcServer = useContext(IPCServerContext)

	const playheadData = useRef<GroupPreparedPlayheadData | null>(null)
	const [activeRundowns, setActiveRundowns] = useState<{ [rundownId: string]: true }>({})
	useEffect(() => {
		playheadData.current = group.playheadData

		const activeRundowns0: { [rundownId: string]: true } = {}

		if (group.playheadData) {
			for (const rundown of group.playheadData.rundowns) {
				activeRundowns0[rundown.rundown.id] = true
			}
			if (group.playheadData.repeating) {
				for (const rundown of group.playheadData.repeating.rundowns) {
					activeRundowns0[rundown.rundown.id] = true
				}
			}
		}
		setActiveRundowns(activeRundowns0)
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

	/** Whether we're allowed to stop playing */
	const wasPlayingRef = useRef(false)
	const stopPlayingRef = useRef(true)
	useEffect(() => {
		if (group.playheadData && !playhead && wasPlayingRef.current) {
			// We believe that we are are playing, but we don't have a playhead.
			// That probably means that we have reached the end.

			if (stopPlayingRef.current) {
				console.log('Auto-stopping group', group.id)

				ipcServer.stopGroup({ groupId: group.id })
				stopPlayingRef.current = false
			}
		} else {
			stopPlayingRef.current = true
		}

		// We are definitely playing
		if (group.playheadData && playhead) {
			wasPlayingRef.current = true
		} else {
			wasPlayingRef.current = false
		}
	}, [playhead])

	if (group.transparent) {
		const firstRundown = group.rundowns[0]
		return firstRundown ? <RundownView rundown={firstRundown} parentGroup={group} playhead={playhead} /> : null
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
									ipcServer.toggleGroupAutoplay({ groupId: group.id, value: !group.autoPlay })
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
									ipcServer.toggleGroupLoop({ groupId: group.id, value: !group.loop })
								}}
							/>
							<label htmlFor="loop" className="toggle-label">
								Loop
							</label>
						</div>
						<TrashBtn
							onClick={() => {
								ipcServer.deleteGroup({ groupId: group.id })
							}}
						/>
					</div>
				</div>
				<div className="group__content">
					{group.rundowns.map((rundown) => (
						<RundownView key={rundown.id} rundown={rundown} parentGroup={group} playhead={playhead} />
					))}

					<GroupOptions group={group} />
				</div>
			</div>
		)
	}
}

const GroupOptions: React.FC<{ group: GroupModel }> = (props) => {
	const ipcServer = useContext(IPCServerContext)
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
							ipcServer.newRundown({
								name: values.name,
								groupId: props.group.id,
							})
							setNewRundownOpen(false)
						}}
					>
						{(formik) => (
							<Form>
								<FormRow>
									<label htmlFor="name">Name</label>
									<Field id="name" name="name" placeholder="Rundown name" autoFocus={true} />
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
