export interface Peripheral {
	id: string
	bridgeId: string
	name: string

	status: {
		connected: boolean
		/** Timestamp */
		lastConnected: number
	}
}
