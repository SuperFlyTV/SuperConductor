import { LogEntry } from 'winston'
import { AppSettings, AppSystem } from '../models/AppData'

/** This class is used server-side, to send messages to the client */
export interface IPCClientMethods {
	log: (entry: LogEntry) => void
	settings: (settings: AppSettings) => void
	system: (system: AppSystem) => void
}
/** Methods that can be called on the server, by the client */
export interface IPCServerMethods {
	updateSettings: (settings: Partial<AppSettings>) => void
	initialized: () => void
}
