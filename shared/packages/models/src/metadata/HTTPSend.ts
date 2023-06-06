import { MetadataBase, MetadataType } from './metadata'

export interface HTTPSendMetadata extends MetadataBase {
	metadataType: MetadataType.HTTP_SEND
}
