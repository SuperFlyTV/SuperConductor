export function getPeripheralId(bridgeId: string, deviceId: string): string {
	return `${bridgeId}-${deviceId}`
}
