import React from 'react'
import { InfoGroup, DataRow } from './InfoGroup'
import moment from 'moment'
import { ResourceAny, ResourceType } from '@shared/models'
import { assertNever, bytesToSize } from '@shared/lib'

export const ResourceInfo: React.FC<{ resource: ResourceAny }> = ({ resource }) => {
	if (resource.resourceType === ResourceType.CASPARCG_MEDIA) {
		return (
			<InfoGroup title="CasparCG Media">
				<DataRow label="Name" value={resource.name} />
				<DataRow label="Type" value={resource.type} />
				<DataRow label="Filesize" value={bytesToSize(resource.size)} />
				<DataRow label="Changed" value={moment(resource.changed).format('DD.MM.YYYY HH:mm')} />
				<DataRow label="Frames" value={resource.frames ? resource.frames : ''} />
				<DataRow label="Frame time" value={resource.frameTime ? resource.frameTime : ''} />
				<DataRow label="Frame rate" value={resource.frameRate ? resource.frameRate : ''} />
				<DataRow label="Duration" value={resource.duration ? resource.duration : ''} />
			</InfoGroup>
		)
	} else if (resource.resourceType === ResourceType.CASPARCG_TEMPLATE) {
		return (
			<InfoGroup title="CasparCG Template">
				<DataRow label="Name" value={resource.name} />
			</InfoGroup>
		)
	} else if (resource.resourceType === ResourceType.CASPARCG_SERVER) {
		return (
			<InfoGroup title="CasparCG Server">
				<DataRow label="Channels" value={resource.channels} />
			</InfoGroup>
		)
	} else {
		assertNever(resource)
		return null
	}
}
