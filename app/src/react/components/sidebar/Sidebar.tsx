import React, { useEffect, useState } from 'react'
import { MediaModel } from '@/models/MediaModel'
import { AppModel } from '@/models/AppModel'
import { TimelineContentTypeCasparCg, TSRTimelineObj } from 'timeline-state-resolver-types'
import { MediaInfo } from './MediaInfo'
import { TimelineObjInfo } from './TimelineObjInfo'
import { TemplateData } from './TemplateData'
import { findMedia, findTimelineObj } from '@/lib/util'
import { MediaLibrary } from './MediaLibrary'

type PropsType = {
	appData: AppModel
}

export const Sidebar = (props: PropsType) => {
	const [timelineObj, setTimelineObj] = useState<TSRTimelineObj>()
	const [media, setMedia] = useState<MediaModel>()

	useEffect(() => {
		if (props.appData.selectedTimelineObjId) {
			const foundTimelineObj = findTimelineObj(props.appData.rundowns, props.appData.selectedTimelineObjId)
			setTimelineObj(foundTimelineObj)

			const mediaFilename = (foundTimelineObj?.content as any).file
			const foundMedia = findMedia(props.appData.media, mediaFilename)
			setMedia(foundMedia)
		}
	}, [props.appData])

	let sidebarTitle = ''
	if (timelineObj) {
		const objContent = timelineObj.content as any
		if (objContent.type === TimelineContentTypeCasparCg.TEMPLATE) {
			sidebarTitle = objContent.name
		} else if (objContent.type === TimelineContentTypeCasparCg.MEDIA) {
			sidebarTitle = objContent.file
		}
	}

	return (
		<div className="sidebar timeline-obj-sidebar">
			{sidebarTitle && <div className="title">{sidebarTitle}</div>}
			{media && <MediaInfo media={media} />}
			{timelineObj && <TimelineObjInfo timelineObj={timelineObj} />}

			{timelineObj && (timelineObj.content as any)?.type === TimelineContentTypeCasparCg.TEMPLATE && (
				<TemplateData templateData={JSON.parse((timelineObj.content as any)?.data)} />
			)}

			{timelineObj && <div className="sep" />}

			<MediaLibrary appData={props.appData} />
		</div>
	)
}
