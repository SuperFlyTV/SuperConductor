import { MetadataBase, MetadataType } from './metadata.js'

export interface HyperdeckMetadata extends MetadataBase {
	metadataType: MetadataType.HYPERDECK
}
