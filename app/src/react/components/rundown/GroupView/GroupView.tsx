import React, { useEffect, useRef, useState, useContext } from 'react'
import Toggle from '@atlaskit/toggle'
import { TrashBtn } from '../../inputs/TrashBtn'
import { Group } from '@/models/rundown/Group'
import { PartView } from './PartView'
import { getGroupPlayhead, GroupPlayhead } from '@/lib/playhead'
import { GroupPreparedPlayheadData } from '@/models/GUI/PreparedPlayhead'
import { IPCServerContext } from '@/react/contexts/IPCServer'
import { PartPropertiesDialog } from './PartPropertiesDialog'

export const GroupView: React.FC<{ rundownId: string; group: Group }> = ({ group, rundownId }) => {
	const ipcServer = useContext(IPCServerContext)

	const playheadData = useRef<GroupPreparedPlayheadData | null>(null)
	const [activeParts, setActiveParts] = useState<{ [partId: string]: true }>({})
	useEffect(() => {
		playheadData.current = group.playheadData

		const activeParts0: { [partId: string]: true } = {}

		if (group.playheadData) {
			for (const part of group.playheadData.parts) {
				activeParts0[part.part.id] = true
			}
			if (group.playheadData.repeating) {
				for (const part of group.playheadData.repeating.parts) {
					activeParts0[part.part.id] = true
				}
			}
		}
		setActiveParts(activeParts0)
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

				ipcServer.stopGroup({ rundownId, groupId: group.id })
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
		const firstPart = group.parts[0]
		return firstPart ? (
			<PartView rundownId={rundownId} part={firstPart} parentGroup={group} playhead={playhead} />
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
									ipcServer.toggleGroupAutoplay({ rundownId, groupId: group.id, value: !group.autoPlay })
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
									ipcServer.toggleGroupLoop({ rundownId, groupId: group.id, value: !group.loop })
								}}
							/>
							<label htmlFor="loop" className="toggle-label">
								Loop
							</label>
						</div>
						<TrashBtn
							onClick={() => {
								ipcServer.deleteGroup({ rundownId, groupId: group.id })
							}}
						/>
					</div>
				</div>
				<div className="group__content">
					{group.parts.map((part) => (
						<PartView key={part.id} rundownId={rundownId} part={part} parentGroup={group} playhead={playhead} />
					))}

					<GroupOptions rundownId={rundownId} group={group} />
				</div>
			</div>
		)
	}
}

const GroupOptions: React.FC<{ rundownId: string; group: Group }> = ({ rundownId, group }) => {
	const ipcServer = useContext(IPCServerContext)
	const [newPartOpen, setNewPartOpen] = React.useState(false)

	return (
		<>
			<div className="group-list__control-row">
				<button className="btn form" onClick={() => setNewPartOpen(true)}>
					New part
				</button>
			</div>
			{newPartOpen && (
				<PartPropertiesDialog
					acceptLabel="Create"
					onAccepted={(part) => {
						ipcServer.newPart({
							rundownId,
							name: part.name,
							groupId: group.id,
						})
						setNewPartOpen(false)
					}}
					onDiscarded={() => setNewPartOpen(false)}
				/>
			)}
		</>
	)
}
