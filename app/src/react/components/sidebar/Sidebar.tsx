import React, { useEffect, useState } from 'react'
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
import { RundownModel } from '@/models/RundownModel'

type PropsType = {
	appData: AppModel
}

export const Sidebar = (props: PropsType) => {
	const [editing, setEditing] = useState<{
		group: GroupModel
		rundown: RundownModel
		timelineObj: TSRTimelineObj
	}>()
	const [media, setMedia] = useState<MediaModel>()

	useEffect(() => {
		if (props.appData.selectedTimelineObjId) {
			const found = findTimelineObj(props.appData, props.appData.selectedTimelineObjId)
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
	}, [props.appData])

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
