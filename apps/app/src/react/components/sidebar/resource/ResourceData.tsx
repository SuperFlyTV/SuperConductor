import React from 'react'
import { DataRow } from '../ResourceData'
import moment from 'moment'
import { ResourceAny, ResourceType } from '@shared/models'
import { assertNever, bytesToSize } from '@shared/lib'

const TIMESTAMP_FORMAT = 'DD.MM.YYYY HH:mm'

export const ResourceData: React.FC<{ resource: ResourceAny }> = ({ resource }) => {
	/**
	 * Rows that every resource type uses.
	 */
	const universalRows = (
		<>
			<DataRow label="Added" value={moment(resource.added).format(TIMESTAMP_FORMAT)} />
			<DataRow label="Modified" value={moment(resource.modified).format(TIMESTAMP_FORMAT)} />
		</>
	)

	if (resource.resourceType === ResourceType.CASPARCG_MEDIA) {
		return (
			<ResourceData title="CasparCG Media">
				<DataRow label="Name" value={resource.name} />
				{universalRows}
				<DataRow label="Type" value={resource.type} />
				<DataRow label="Filesize" value={bytesToSize(resource.size)} />
				<DataRow label="Frames" value={resource.frames ? resource.frames : ''} />
				<DataRow label="Frame time" value={resource.frameTime ? resource.frameTime : ''} />
				<DataRow label="Frame rate" value={resource.frameRate ? resource.frameRate : ''} />
				<DataRow label="Duration" value={resource.duration ? resource.duration : ''} />
			</ResourceData>
		)
	} else if (resource.resourceType === ResourceType.CASPARCG_TEMPLATE) {
		return (
			<ResourceData title="CasparCG Template">
				<DataRow label="Name" value={resource.name} />
				{universalRows}
			</ResourceData>
		)
	} else if (resource.resourceType === ResourceType.CASPARCG_SERVER) {
		return (
			<ResourceData title="CasparCG Server">
				<DataRow label="Channels" value={resource.channels} />
				{universalRows}
			</ResourceData>
		)
	} else if (resource.resourceType === ResourceType.ATEM_ME) {
		return (
			<ResourceData title="ATEM ME">
				<DataRow label="Index" value={resource.index} />
				{universalRows}
			</ResourceData>
		)
	} else if (resource.resourceType === ResourceType.ATEM_DSK) {
		return (
			<ResourceData title="ATEM DSK">
				<DataRow label="Index" value={resource.index} />
				{universalRows}
			</ResourceData>
		)
	} else if (resource.resourceType === ResourceType.ATEM_AUX) {
		return (
			<ResourceData title="ATEM AUX">
				<DataRow label="Index" value={resource.index} />
				{universalRows}
			</ResourceData>
		)
	} else if (resource.resourceType === ResourceType.ATEM_SSRC) {
		return (
			<ResourceData title="ATEM SuperSource">
				<DataRow label="Index" value={resource.index} />
				{universalRows}
			</ResourceData>
		)
	} else if (resource.resourceType === ResourceType.ATEM_SSRC_PROPS) {
		return (
			<ResourceData title="ATEM SuperSource Props">
				<DataRow label="Index" value={resource.index} />
				{universalRows}
			</ResourceData>
		)
	} else if (resource.resourceType === ResourceType.ATEM_MACRO_PLAYER) {
		return <ResourceData title="ATEM Macro Player">{universalRows}</ResourceData>
	} else if (resource.resourceType === ResourceType.ATEM_AUDIO_CHANNEL) {
		return (
			<ResourceData title="ATEM Audio Channel">
				<DataRow label="Index" value={resource.index} />
				{universalRows}
			</ResourceData>
		)
	} else if (resource.resourceType === ResourceType.ATEM_MEDIA_PLAYER) {
		return (
			<ResourceData title="ATEM Media Player">
				<DataRow label="Index" value={resource.index} />
				{universalRows}
			</ResourceData>
		)
	} else if (resource.resourceType === ResourceType.OBS_SCENE) {
		return (
			<ResourceData title="OBS Scene">
				<DataRow label="Name" value={resource.name} />
				{universalRows}
			</ResourceData>
		)
	} else if (resource.resourceType === ResourceType.OBS_TRANSITION) {
		return (
			<ResourceData title="OBS Transition">
				<DataRow label="Name" value={resource.name} />
				{universalRows}
			</ResourceData>
		)
	} else if (resource.resourceType === ResourceType.OBS_RECORDING) {
		return <ResourceData title="OBS Recording">{universalRows}</ResourceData>
	} else if (resource.resourceType === ResourceType.OBS_STREAMING) {
		return <ResourceData title="OBS Streaming">{universalRows}</ResourceData>
	} else if (resource.resourceType === ResourceType.OBS_SOURCE_SETTINGS) {
		return <ResourceData title="OBS Source Settings">{universalRows}</ResourceData>
	} else if (resource.resourceType === ResourceType.OBS_MUTE) {
		return <ResourceData title="OBS Mute">{universalRows}</ResourceData>
	} else if (resource.resourceType === ResourceType.OBS_RENDER) {
		return <ResourceData title="OBS Render">{universalRows}</ResourceData>
	} else if (resource.resourceType === ResourceType.VMIX_INPUT) {
		return (
			<ResourceData title="vMix Input">
				<DataRow label="Number" value={resource.number} />
				<DataRow label="Type" value={resource.type} />
				{universalRows}
			</ResourceData>
		)
	} else if (resource.resourceType === ResourceType.VMIX_INPUT_SETTINGS) {
		return <ResourceData title="vMix Input Settings">{universalRows}</ResourceData>
	} else if (resource.resourceType === ResourceType.VMIX_AUDIO_SETTINGS) {
		return <ResourceData title="vMix Audio Settings">{universalRows}</ResourceData>
	} else if (resource.resourceType === ResourceType.VMIX_OUTPUT_SETTINGS) {
		return <ResourceData title="vMix Output Settings">{universalRows}</ResourceData>
	} else if (resource.resourceType === ResourceType.VMIX_OVERLAY_SETTINGS) {
		return <ResourceData title="vMix Overlay Settings">{universalRows}</ResourceData>
	} else if (resource.resourceType === ResourceType.VMIX_RECORDING) {
		return <ResourceData title="vMix Recording">{universalRows}</ResourceData>
	} else if (resource.resourceType === ResourceType.VMIX_STREAMING) {
		return <ResourceData title="vMix Streaming">{universalRows}</ResourceData>
	} else if (resource.resourceType === ResourceType.VMIX_EXTERNAL) {
		return <ResourceData title="vMix External Output">{universalRows}</ResourceData>
	} else if (resource.resourceType === ResourceType.VMIX_FADE_TO_BLACK) {
		return <ResourceData title="vMix Fade To Black">{universalRows}</ResourceData>
	} else if (resource.resourceType === ResourceType.VMIX_FADER) {
		return <ResourceData title="vMix Fader">{universalRows}</ResourceData>
	} else if (resource.resourceType === ResourceType.VMIX_PREVIEW) {
		return <ResourceData title="vMix Preview">{universalRows}</ResourceData>
	} else if (resource.resourceType === ResourceType.OSC_MESSAGE) {
		return <ResourceData title="OSC Message">{universalRows}</ResourceData>
	} else if (resource.resourceType === ResourceType.HTTP_REQUEST) {
		return <ResourceData title="HTTP Request">{universalRows}</ResourceData>
	} else {
		assertNever(resource)
		return null
	}
}

export const ResourceData: React.FC<{
	title: string

	children: React.ReactNode
}> = ({ title, children }) => {
	return (
		<div>
			<div>{title}</div>
			{children}
		</div>
	)
}
