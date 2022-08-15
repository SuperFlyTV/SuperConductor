import React from 'react'

import moment from 'moment'
import { ResourceAny, ResourceType } from '@shared/models'
import { assertNever, bytesToSize } from '@shared/lib'
import { DataRow } from '../DataRow/DataRow'

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
		const hasDurations = resource.type !== 'image'
		return (
			<ResourceDataInner title="CasparCG Media">
				<DataRow label="Name" value={resource.name} />
				{universalRows}
				<DataRow label="Type" value={resource.type} />
				<DataRow label="Filesize" value={bytesToSize(resource.size)} />

				{hasDurations && <DataRow label="Frames" value={resource.frames ? resource.frames : ''} />}
				{hasDurations && <DataRow label="Frame time" value={resource.frameTime ? resource.frameTime : ''} />}
				{hasDurations && <DataRow label="Frame rate" value={resource.frameRate ? resource.frameRate : ''} />}
				{hasDurations && <DataRow label="Duration" value={resource.duration ? resource.duration : ''} />}
			</ResourceDataInner>
		)
	} else if (resource.resourceType === ResourceType.CASPARCG_TEMPLATE) {
		return (
			<ResourceDataInner title="CasparCG Template">
				<DataRow label="Name" value={resource.name} />
				{universalRows}
			</ResourceDataInner>
		)
	} else if (resource.resourceType === ResourceType.CASPARCG_SERVER) {
		return (
			<ResourceDataInner title="CasparCG Server">
				<DataRow label="Channels" value={resource.channels} />
				{universalRows}
			</ResourceDataInner>
		)
	} else if (resource.resourceType === ResourceType.ATEM_ME) {
		return (
			<ResourceDataInner title="ATEM ME">
				<DataRow label="Index" value={resource.index} />
				{universalRows}
			</ResourceDataInner>
		)
	} else if (resource.resourceType === ResourceType.ATEM_DSK) {
		return (
			<ResourceDataInner title="ATEM DSK">
				<DataRow label="Index" value={resource.index} />
				{universalRows}
			</ResourceDataInner>
		)
	} else if (resource.resourceType === ResourceType.ATEM_AUX) {
		return (
			<ResourceDataInner title="ATEM AUX">
				<DataRow label="Index" value={resource.index} />
				{universalRows}
			</ResourceDataInner>
		)
	} else if (resource.resourceType === ResourceType.ATEM_SSRC) {
		return (
			<ResourceDataInner title="ATEM SuperSource">
				<DataRow label="Index" value={resource.index} />
				{universalRows}
			</ResourceDataInner>
		)
	} else if (resource.resourceType === ResourceType.ATEM_SSRC_PROPS) {
		return (
			<ResourceDataInner title="ATEM SuperSource Props">
				<DataRow label="Index" value={resource.index} />
				{universalRows}
			</ResourceDataInner>
		)
	} else if (resource.resourceType === ResourceType.ATEM_MACRO_PLAYER) {
		return <ResourceDataInner title="ATEM Macro Player">{universalRows}</ResourceDataInner>
	} else if (resource.resourceType === ResourceType.ATEM_AUDIO_CHANNEL) {
		return (
			<ResourceDataInner title="ATEM Audio Channel">
				<DataRow label="Index" value={resource.index} />
				{universalRows}
			</ResourceDataInner>
		)
	} else if (resource.resourceType === ResourceType.ATEM_MEDIA_PLAYER) {
		return (
			<ResourceDataInner title="ATEM Media Player">
				<DataRow label="Index" value={resource.index} />
				{universalRows}
			</ResourceDataInner>
		)
	} else if (resource.resourceType === ResourceType.OBS_SCENE) {
		return (
			<ResourceDataInner title="OBS Scene">
				<DataRow label="Name" value={resource.name} />
				{universalRows}
			</ResourceDataInner>
		)
	} else if (resource.resourceType === ResourceType.OBS_TRANSITION) {
		return (
			<ResourceDataInner title="OBS Transition">
				<DataRow label="Name" value={resource.name} />
				{universalRows}
			</ResourceDataInner>
		)
	} else if (resource.resourceType === ResourceType.OBS_RECORDING) {
		return <ResourceDataInner title="OBS Recording">{universalRows}</ResourceDataInner>
	} else if (resource.resourceType === ResourceType.OBS_STREAMING) {
		return <ResourceDataInner title="OBS Streaming">{universalRows}</ResourceDataInner>
	} else if (resource.resourceType === ResourceType.OBS_SOURCE_SETTINGS) {
		return <ResourceDataInner title="OBS Source Settings">{universalRows}</ResourceDataInner>
	} else if (resource.resourceType === ResourceType.OBS_MUTE) {
		return <ResourceDataInner title="OBS Mute">{universalRows}</ResourceDataInner>
	} else if (resource.resourceType === ResourceType.OBS_RENDER) {
		return <ResourceDataInner title="OBS Render">{universalRows}</ResourceDataInner>
	} else if (resource.resourceType === ResourceType.VMIX_INPUT) {
		return (
			<ResourceDataInner title="vMix Input">
				<DataRow label="Number" value={resource.number} />
				<DataRow label="Type" value={resource.type} />
				{universalRows}
			</ResourceDataInner>
		)
	} else if (resource.resourceType === ResourceType.VMIX_INPUT_SETTINGS) {
		return <ResourceDataInner title="vMix Input Settings">{universalRows}</ResourceDataInner>
	} else if (resource.resourceType === ResourceType.VMIX_AUDIO_SETTINGS) {
		return <ResourceDataInner title="vMix Audio Settings">{universalRows}</ResourceDataInner>
	} else if (resource.resourceType === ResourceType.VMIX_OUTPUT_SETTINGS) {
		return <ResourceDataInner title="vMix Output Settings">{universalRows}</ResourceDataInner>
	} else if (resource.resourceType === ResourceType.VMIX_OVERLAY_SETTINGS) {
		return <ResourceDataInner title="vMix Overlay Settings">{universalRows}</ResourceDataInner>
	} else if (resource.resourceType === ResourceType.VMIX_RECORDING) {
		return <ResourceDataInner title="vMix Recording">{universalRows}</ResourceDataInner>
	} else if (resource.resourceType === ResourceType.VMIX_STREAMING) {
		return <ResourceDataInner title="vMix Streaming">{universalRows}</ResourceDataInner>
	} else if (resource.resourceType === ResourceType.VMIX_EXTERNAL) {
		return <ResourceDataInner title="vMix External Output">{universalRows}</ResourceDataInner>
	} else if (resource.resourceType === ResourceType.VMIX_FADE_TO_BLACK) {
		return <ResourceDataInner title="vMix Fade To Black">{universalRows}</ResourceDataInner>
	} else if (resource.resourceType === ResourceType.VMIX_FADER) {
		return <ResourceDataInner title="vMix Fader">{universalRows}</ResourceDataInner>
	} else if (resource.resourceType === ResourceType.VMIX_PREVIEW) {
		return <ResourceDataInner title="vMix Preview">{universalRows}</ResourceDataInner>
	} else if (resource.resourceType === ResourceType.OSC_MESSAGE) {
		return <ResourceDataInner title="OSC Message">{universalRows}</ResourceDataInner>
	} else if (resource.resourceType === ResourceType.HTTP_REQUEST) {
		return <ResourceDataInner title="HTTP Request">{universalRows}</ResourceDataInner>
	} else if (resource.resourceType === ResourceType.HYPERDECK_PLAY) {
		return <ResourceDataInner title="Hyperdeck Play">{universalRows}</ResourceDataInner>
	} else if (resource.resourceType === ResourceType.HYPERDECK_RECORD) {
		return <ResourceDataInner title="Hyperdeck Record">{universalRows}</ResourceDataInner>
	} else {
		assertNever(resource)
		return null
	}
}

const ResourceDataInner: React.FC<{
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
