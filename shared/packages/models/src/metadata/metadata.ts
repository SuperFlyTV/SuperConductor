import { AtemMetadata } from './Atem'
import { CasparCGMetadata } from './CasparCG'
import { HTTPSendMetadata } from './HTTPSend'
import { HyperdeckMetadata } from './Hyperdeck'
import { OBSMetadata } from './OBS'
import { OSCMetadata } from './OSC'
import { TCPSendMetadata } from './TCPSend'
import { VMixMetadata } from './VMix'

export type MetadataAny =
	| AtemMetadata
	| CasparCGMetadata
	| HTTPSendMetadata
	| OBSMetadata
	| OSCMetadata
	| VMixMetadata
	| HyperdeckMetadata
	| TCPSendMetadata

export interface MetadataBase {
	metadataType: MetadataType

	/** When the Metadata was added to the Library [unix timestamp, ms] */
	added?: number

	/** When the Metadata was last modified [unix timestamp, ms] */
	modified?: number
}
export enum MetadataType {
	ATEM = 'ATEM',
	CASPARCG = 'CASPARCG',
	HTTP_SEND = 'HTTP_SEND',
	HYPERDECK = 'HYPERDECK',
	OBS = 'OBS',
	OSC = 'OSC',
	VMIX = 'VMIX',
	TCP_SEND = 'TCP_SEND',
}
