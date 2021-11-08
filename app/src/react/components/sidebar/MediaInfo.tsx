import React from 'react'
import { MediaModel } from '@/models/MediaModel'
import { DataRow } from './DataRow'
import { InfoGroup } from './InfoGroup'
import { bytesToSize } from '@/lib/bytesToSize'
import moment from 'moment'

export const MediaInfo = ({ media }: { media: MediaModel }) => {
	return (
		<InfoGroup title="Media">
			<DataRow label="Name" value={media.name} />
			<DataRow label="Type" value={media.type} />
			<DataRow label="Filesize" value={bytesToSize(media.size)} />
			<DataRow label="Changed" value={moment(media.changed).format('DD.MM.YYYY HH:mm')} />
			<DataRow label="Frames" value={media.frames ? media.frames : ''} />
			<DataRow label="Frame time" value={media.frameTime ? media.frameTime : ''} />
			<DataRow label="Frame rate" value={media.frameRate ? media.frameRate : ''} />
			<DataRow label="Duration" value={media.duration ? media.duration : ''} />
		</InfoGroup>
	)
}
