import { MetadataBase, MetadataType } from './metadata'

export interface TCPSendMetadata extends MetadataBase {
	metadataType: MetadataType.TCP_SEND
}
