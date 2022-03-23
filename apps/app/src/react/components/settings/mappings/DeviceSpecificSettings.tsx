import React from 'react'
import {
	DeviceType,
	Mapping,
	MappingAtem,
	MappingCasparCG,
	MappingOBS,
	MappingVMixAny,
} from 'timeline-state-resolver-types'
import { CasparCGMappingSettings } from './device-specific-settings/CasparCGMappingSettings'
import { AtemMappingSettings } from './device-specific-settings/AtemMappingSettings'
import { OBSMappingSettings } from './device-specific-settings/OBSMappingSettings'
import { VMixMappingSettings } from './device-specific-settings/VMixMappingSettings'

interface IDeviceSpecificSettingsProps {
	mapping: Mapping
	mappingId: string
}

export const DeviceSpecificSettings: React.FC<IDeviceSpecificSettingsProps> = ({ mapping, mappingId }) => {
	switch (mapping.device) {
		case DeviceType.CASPARCG:
			return <CasparCGMappingSettings mapping={mapping as MappingCasparCG} mappingId={mappingId} />
		case DeviceType.ATEM:
			return <AtemMappingSettings mapping={mapping as MappingAtem} mappingId={mappingId} />
		case DeviceType.OBS:
			return <OBSMappingSettings mapping={mapping as MappingOBS} mappingId={mappingId} />
		case DeviceType.VMIX:
			return <VMixMappingSettings mapping={mapping as MappingVMixAny} mappingId={mappingId} />
		default:
			// @TODO: More device types
			// assertNever(mapping.device)
			return null
	}
}
