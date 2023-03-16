import { InputState } from 'atem-connection'
import { MetadataBase } from './metadata'

export interface AtemMetadata extends MetadataBase {
	inputs: AtemInputMetadata[]
}

export type AtemInputMetadata = InputState.InputChannel
