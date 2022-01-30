import { IPCServer } from '../api/IPCServer'
import React from 'react'
/** Used to communicate with the backend */
export const IPCServerContext = React.createContext<IPCServer>({} as IPCServer)
