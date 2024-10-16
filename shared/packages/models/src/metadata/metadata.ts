import { AtemMetadata } from './Atem.js'
import { CasparCGMetadata } from './CasparCG.js'
import { HTTPSendMetadata } from './HTTPSend.js'
import { HyperdeckMetadata } from './Hyperdeck.js'
import { OBSMetadata } from './OBS.js'
import { OSCMetadata } from './OSC.js'
import { TCPSendMetadata } from './TCPSend.js'
import { TriCasterMetadata } from './TriCaster.js'
import { VMixMetadata } from './VMix.js'

export type MetadataAny =
	| AtemMetadata
	| CasparCGMetadata
	| HTTPSendMetadata
	| OBSMetadata
	| OSCMetadata
	| VMixMetadata
	| HyperdeckMetadata
	| TCPSendMetadata
	| TriCasterMetadata

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
	TRICASTER = 'TRICASTER',
}
