import { MetadataBase, MetadataType } from './metadata.js'

export interface HTTPSendMetadata extends MetadataBase {
	metadataType: MetadataType.HTTP_SEND
}
