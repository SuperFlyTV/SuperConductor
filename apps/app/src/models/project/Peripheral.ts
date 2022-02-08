export interface Peripheral {
	id: string
	name: string

	status: {
		connected: boolean
		/** Timestamp */
		lastConnected: number
	}
}
