import { IPCServer } from '../api/IPCServer.js'
import React from 'react'
/** Used to communicate with the backend */
export const IPCServerContext = React.createContext<IPCServer>({} as IPCServer)
