import React, { useContext, useEffect, useState } from 'react'
import { MediaModel } from '@/models/MediaModel'
import { AppModel } from '@/models/AppModel'
import { TimelineContentTypeCasparCg, TSRTimelineObj } from 'timeline-state-resolver-types'
import { MediaInfo } from './MediaInfo'
import { TimelineObjInfo } from './TimelineObjInfo'
import { TemplateData } from './TemplateData'
import { findMedia, findTimelineObj } from '@/lib/util'
import { MediaLibrary } from './MediaLibrary'
import { TemplatesLibrary } from './TemplatesLibrary'
import { GroupModel } from '@/models/GroupModel'
import { PartModel } from '@/models/PartModel'
import { GUIContext } from '@/react/App'

export const Sidebar: React.FC<{ appData: AppModel }> = (props) => {
	const { gui, updateGUI } = useContext(GUIContext)
	const [editing, setEditing] = useState<{
		group: GroupModel
		part: PartModel
		timelineObj: TSRTimelineObj
	}>()
	const [media, setMedia] = useState<MediaModel>()

	useEffect(() => {
		if (gui.selectedTimelineObjId) {
			const found = findTimelineObj(props.appData, gui.selectedTimelineObjId)
			if (found) {
				setEditing(found)
				const mediaFilename = (found?.timelineObj.content as any).file
				const foundMedia = findMedia(props.appData.media, mediaFilename)
				setMedia(foundMedia)
			} else {
				setEditing(undefined)
			}
		} else {
			setEditing(undefined)
		}
	}, [props.appData, gui.selectedTimelineObjId])

	let sidebarTitle = ''
	if (editing) {
		const objContent = editing.timelineObj.content as any
		if (objContent.type === TimelineContentTypeCasparCg.TEMPLATE) {
			sidebarTitle = objContent.name
		} else if (objContent.type === TimelineContentTypeCasparCg.MEDIA) {
			sidebarTitle = objContent.file
		}
	}

	return (
		<div className="sidebar timeline-obj-sidebar">
			{sidebarTitle && <div className="title">{sidebarTitle}</div>}

			{editing && media && <MediaInfo media={media} />}
			{editing && <TimelineObjInfo timelineObj={editing.timelineObj} appMappings={props.appData.mappings} />}

			{editing && (editing.timelineObj.content as any)?.type === TimelineContentTypeCasparCg.TEMPLATE && (
				<TemplateData
					timelineObjId={editing.timelineObj.id}
					templateData={JSON.parse((editing.timelineObj.content as any)?.data)}
				/>
			)}

			{!editing && <MediaLibrary appData={props.appData} />}
			{!editing && <TemplatesLibrary appData={props.appData} />}
		</div>
	)
}
