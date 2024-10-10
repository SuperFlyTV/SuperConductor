import { MetadataBase, MetadataType } from './metadata.js'

export interface TCPSendMetadata extends MetadataBase {
	metadataType: MetadataType.TCP_SEND
}
