import React from 'react'
import {
	DeviceType,
	Mapping,
	SomeMappingAtem,
	SomeMappingCasparCG,
	SomeMappingObs,
	SomeMappingTricaster,
	SomeMappingVmix,
	TSRMappingOptions,
} from 'timeline-state-resolver-types'
import { CasparCGMappingSettings } from './device-specific-settings/CasparCGMappingSettings.js'
import { AtemMappingSettings } from './device-specific-settings/AtemMappingSettings.js'
import { OBSMappingSettings } from './device-specific-settings/OBSMappingSettings.js'
import { VMixMappingSettings } from './device-specific-settings/VMixMappingSettings.js'
import { TriCasterMappingSettings } from './device-specific-settings/TriCasterMappingSettings.js'

export const DeviceSpecificSettings: React.FC<{
	mapping: Mapping<TSRMappingOptions>
	device: DeviceType
	onUpdate: (mappingOptionsUpdate: TSRMappingOptions) => void
}> = (props) => {
	switch (props.device) {
		case DeviceType.CASPARCG:
			return (
				<CasparCGMappingSettings
					mapping={props.mapping.options as SomeMappingCasparCG}
					onUpdate={props.onUpdate}
				/>
			)
		case DeviceType.ATEM:
			return <AtemMappingSettings mapping={props.mapping.options as SomeMappingAtem} />
		case DeviceType.OBS:
			return <OBSMappingSettings mapping={props.mapping.options as SomeMappingObs} />
		case DeviceType.TRICASTER:
			return <TriCasterMappingSettings mapping={props.mapping.options as SomeMappingTricaster} />
		case DeviceType.VMIX:
			return <VMixMappingSettings mapping={props.mapping.options as SomeMappingVmix} onUpdate={props.onUpdate} />
		default:
			// @TODO: More device types
			// assertNever(mapping.device)
			return null
	}
}
