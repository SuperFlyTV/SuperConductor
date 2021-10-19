import React, { useEffect, useState } from 'react'
import { MediaModel } from '@/models/MediaModel'
import { AppModel } from '@/models/AppModel'
import { TimelineContentTypeCasparCg, TSRTimelineObj } from 'timeline-state-resolver-types'
import { MediaInfo } from './MediaInfo'
import { TimelineObjInfo } from './TimelineObjInfo'
import { TemplateData } from './TemplateData'
import { findMedia, findTimelineObj } from '@/lib/util'

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

	if (!timelineObj) {
		return <div className="sidebar">Nothing selected.</div>
	}

	let sidebarTitle = ''
	const objContent = timelineObj.content as any
	if (objContent.type === TimelineContentTypeCasparCg.TEMPLATE) {
		sidebarTitle = objContent.name
	} else if (objContent.type === TimelineContentTypeCasparCg.MEDIA) {
		sidebarTitle = objContent.file
	}

	return (
		<div className="sidebar">
			<div className="title">{sidebarTitle}</div>
			{media && <MediaInfo media={media} />}
			{timelineObj && <TimelineObjInfo timelineObj={timelineObj} />}

			{(timelineObj.content as any)?.type === TimelineContentTypeCasparCg.TEMPLATE && (
				<TemplateData templateData={JSON.parse((timelineObj.content as any)?.data)} />
			)}
		</div>
	)
}
