import React from 'react'
import { MediaModel } from '@/models/MediaModel'
import { DataRow } from './DataRow'
import { InfoGroup } from './InfoGroup'
import { bytesToSize } from '@/lib/bytesToSize'
import moment from 'moment'

export const MediaInfo = ({ media }: { media: MediaModel }) => {
	return (
		<InfoGroup title="Media">
			<DataRow label="Filename" value={media.filename} />
			<DataRow label="Type" value={media.type} />
			<DataRow label="Filesize" value={bytesToSize(media.filesize)} />
			<DataRow label="Last modified" value={moment(media.lastModified).format()} />
			<DataRow label="Frame count" value={media.frameCount ? media.frameCount : ''} />
			<DataRow label="Frame rate/duration" value={media.frameRateDuration} />
		</InfoGroup>
	)
}
