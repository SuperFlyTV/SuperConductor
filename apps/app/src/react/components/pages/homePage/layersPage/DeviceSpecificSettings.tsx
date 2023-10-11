import React from 'react'
import {
	DeviceType,
	Mapping,
	MappingAtem,
	MappingCasparCG,
	MappingOBS,
	MappingTriCaster,
	MappingVMixAny,
} from 'timeline-state-resolver-types'
import { CasparCGMappingSettings } from './device-specific-settings/CasparCGMappingSettings'
import { AtemMappingSettings } from './device-specific-settings/AtemMappingSettings'
import { OBSMappingSettings } from './device-specific-settings/OBSMappingSettings'
import { VMixMappingSettings } from './device-specific-settings/VMixMappingSettings'
import { TriCasterMappingSettings } from './device-specific-settings/TriCasterMappingSettings'

export const DeviceSpecificSettings: React.FC<{
	mapping?: Mapping
	device: DeviceType
	onUpdate: (mappingUpdate: Mapping) => void
}> = (props) => {
	switch (props.device) {
		case DeviceType.CASPARCG:
			return <CasparCGMappingSettings mapping={props.mapping as MappingCasparCG} onUpdate={props.onUpdate} />
		case DeviceType.ATEM:
			return <AtemMappingSettings mapping={props.mapping as MappingAtem} />
		case DeviceType.OBS:
			return <OBSMappingSettings mapping={props.mapping as MappingOBS} />
		case DeviceType.TRICASTER:
			return <TriCasterMappingSettings mapping={props.mapping as MappingTriCaster} />
		case DeviceType.VMIX:
			return <VMixMappingSettings mapping={props.mapping as MappingVMixAny} onUpdate={props.onUpdate} />
		default:
			// @TODO: More device types
			// assertNever(mapping.device)
			return null
	}
}
