import { LogEntry } from 'winston'

/** This class is used server-side, to send messages to the client */
export interface IPCClientMethods {
	log: (entry: LogEntry) => void
}
