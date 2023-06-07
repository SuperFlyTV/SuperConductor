import { InputState } from 'atem-connection'
import { MetadataBase, MetadataType } from './metadata'

export interface AtemMetadata extends MetadataBase {
	metadataType: MetadataType.ATEM
	inputs: AtemInputMetadata[]
}

export type AtemInputMetadata = InputState.InputChannel
