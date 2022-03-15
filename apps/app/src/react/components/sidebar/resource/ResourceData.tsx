import React from 'react'
import { SidebarInfoGroup, DataRow } from '../SidebarInfoGroup'
import moment from 'moment'
import { ResourceAny, ResourceType } from '@shared/models'
import { assertNever, bytesToSize } from '@shared/lib'

export const ResourceData: React.FC<{ resource: ResourceAny }> = ({ resource }) => {
	if (resource.resourceType === ResourceType.CASPARCG_MEDIA) {
		return (
			<SidebarInfoGroup title="CasparCG Media">
				<DataRow label="Name" value={resource.name} />
				<DataRow label="Type" value={resource.type} />
				<DataRow label="Filesize" value={bytesToSize(resource.size)} />
				<DataRow label="Changed" value={moment(resource.changed).format('DD.MM.YYYY HH:mm')} />
				<DataRow label="Frames" value={resource.frames ? resource.frames : ''} />
				<DataRow label="Frame time" value={resource.frameTime ? resource.frameTime : ''} />
				<DataRow label="Frame rate" value={resource.frameRate ? resource.frameRate : ''} />
				<DataRow label="Duration" value={resource.duration ? resource.duration : ''} />
			</SidebarInfoGroup>
		)
	} else if (resource.resourceType === ResourceType.CASPARCG_TEMPLATE) {
		return (
			<SidebarInfoGroup title="CasparCG Template">
				<DataRow label="Name" value={resource.name} />
			</SidebarInfoGroup>
		)
	} else if (resource.resourceType === ResourceType.CASPARCG_SERVER) {
		return (
			<SidebarInfoGroup title="CasparCG Server">
				<DataRow label="Channels" value={resource.channels} />
			</SidebarInfoGroup>
		)
	} else if (resource.resourceType === ResourceType.ATEM_ME) {
		return (
			<SidebarInfoGroup title="ATEM ME">
				<DataRow label="Index" value={resource.index} />
			</SidebarInfoGroup>
		)
	} else if (resource.resourceType === ResourceType.ATEM_DSK) {
		return (
			<SidebarInfoGroup title="ATEM DSK">
				<DataRow label="Index" value={resource.index} />
			</SidebarInfoGroup>
		)
	} else {
		assertNever(resource)
		return null
	}
}
