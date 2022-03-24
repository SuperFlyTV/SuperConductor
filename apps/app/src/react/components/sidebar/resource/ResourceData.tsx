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
	} else if (resource.resourceType === ResourceType.ATEM_AUX) {
		return (
			<SidebarInfoGroup title="ATEM AUX">
				<DataRow label="Index" value={resource.index} />
			</SidebarInfoGroup>
		)
	} else if (resource.resourceType === ResourceType.ATEM_SSRC) {
		return (
			<SidebarInfoGroup title="ATEM SuperSource">
				<DataRow label="Index" value={resource.index} />
			</SidebarInfoGroup>
		)
	} else if (resource.resourceType === ResourceType.ATEM_SSRC_PROPS) {
		return (
			<SidebarInfoGroup title="ATEM SuperSource Props">
				<DataRow label="Index" value={resource.index} />
			</SidebarInfoGroup>
		)
	} else if (resource.resourceType === ResourceType.ATEM_MACRO_PLAYER) {
		return (
			<SidebarInfoGroup title="ATEM Macro Player">
				<></>
			</SidebarInfoGroup>
		)
	} else if (resource.resourceType === ResourceType.ATEM_AUDIO_CHANNEL) {
		return (
			<SidebarInfoGroup title="ATEM Audio Channel">
				<DataRow label="Index" value={resource.index} />
			</SidebarInfoGroup>
		)
	} else if (resource.resourceType === ResourceType.ATEM_MEDIA_PLAYER) {
		return (
			<SidebarInfoGroup title="ATEM Media Player">
				<DataRow label="Index" value={resource.index} />
			</SidebarInfoGroup>
		)
	} else if (resource.resourceType === ResourceType.OBS_SCENE) {
		return (
			<SidebarInfoGroup title="OBS Scene">
				<DataRow label="Name" value={resource.name} />
			</SidebarInfoGroup>
		)
	} else if (resource.resourceType === ResourceType.OBS_TRANSITION) {
		return (
			<SidebarInfoGroup title="OBS Transition">
				<DataRow label="Name" value={resource.name} />
			</SidebarInfoGroup>
		)
	} else if (resource.resourceType === ResourceType.OBS_RECORDING) {
		return (
			<SidebarInfoGroup title="OBS Recording">
				<></>
			</SidebarInfoGroup>
		)
	} else if (resource.resourceType === ResourceType.OBS_STREAMING) {
		return (
			<SidebarInfoGroup title="OBS Streaming">
				<></>
			</SidebarInfoGroup>
		)
	} else if (resource.resourceType === ResourceType.OBS_SOURCE_SETTINGS) {
		return (
			<SidebarInfoGroup title="OBS Source Settings">
				<></>
			</SidebarInfoGroup>
		)
	} else if (resource.resourceType === ResourceType.OBS_MUTE) {
		return (
			<SidebarInfoGroup title="OBS Mute">
				<></>
			</SidebarInfoGroup>
		)
	} else if (resource.resourceType === ResourceType.OBS_RENDER) {
		return (
			<SidebarInfoGroup title="OBS Render">
				<></>
			</SidebarInfoGroup>
		)
	} else if (resource.resourceType === ResourceType.VMIX_INPUT) {
		return (
			<SidebarInfoGroup title="vMix Input">
				<DataRow label="Number" value={resource.number} />
				<DataRow label="Type" value={resource.type} />
			</SidebarInfoGroup>
		)
	} else if (resource.resourceType === ResourceType.VMIX_INPUT_SETTINGS) {
		return (
			<SidebarInfoGroup title="vMix Input Settings">
				<></>
			</SidebarInfoGroup>
		)
	} else if (resource.resourceType === ResourceType.VMIX_AUDIO_SETTINGS) {
		return (
			<SidebarInfoGroup title="vMix Audio Settings">
				<></>
			</SidebarInfoGroup>
		)
	} else if (resource.resourceType === ResourceType.VMIX_OUTPUT_SETTINGS) {
		return (
			<SidebarInfoGroup title="vMix Output Settings">
				<></>
			</SidebarInfoGroup>
		)
	} else if (resource.resourceType === ResourceType.VMIX_OVERLAY_SETTINGS) {
		return (
			<SidebarInfoGroup title="vMix Overlay Settings">
				<></>
			</SidebarInfoGroup>
		)
	} else if (resource.resourceType === ResourceType.VMIX_RECORDING) {
		return (
			<SidebarInfoGroup title="vMix Recording">
				<></>
			</SidebarInfoGroup>
		)
	} else if (resource.resourceType === ResourceType.VMIX_STREAMING) {
		return (
			<SidebarInfoGroup title="vMix Streaming">
				<></>
			</SidebarInfoGroup>
		)
	} else if (resource.resourceType === ResourceType.VMIX_EXTERNAL) {
		return (
			<SidebarInfoGroup title="vMix External Output">
				<></>
			</SidebarInfoGroup>
		)
	} else if (resource.resourceType === ResourceType.VMIX_FADE_TO_BLACK) {
		return (
			<SidebarInfoGroup title="vMix Fade To Black">
				<></>
			</SidebarInfoGroup>
		)
	} else if (resource.resourceType === ResourceType.VMIX_FADER) {
		return (
			<SidebarInfoGroup title="vMix Fader">
				<></>
			</SidebarInfoGroup>
		)
	} else if (resource.resourceType === ResourceType.VMIX_PREVIEW) {
		return (
			<SidebarInfoGroup title="vMix Preview">
				<></>
			</SidebarInfoGroup>
		)
	} else if (resource.resourceType === ResourceType.OSC_MESSAGE) {
		return (
			<SidebarInfoGroup title="OSC Message">
				<></>
			</SidebarInfoGroup>
		)
	} else {
		assertNever(resource)
		return null
	}
}
