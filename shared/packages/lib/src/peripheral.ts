import { PeripheralId, BridgeId } from '@shared/api'
import { ProtectedString, protectString } from '@shared/models'

export function getPeripheralId(bridgeId: BridgeId, peripheralId: PeripheralId): BridgePeripheralId {
	return protectString(`${bridgeId}-${peripheralId}`)
}

export type BridgePeripheralId = ProtectedString<'BridgePeripheralId'>
