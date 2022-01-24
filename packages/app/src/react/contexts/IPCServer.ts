import { IPCServerMethods } from '../../ipc/IPCAPI'
import React from 'react'
/** Used to communicate with the backend */
export const IPCServerContext = React.createContext<IPCServerMethods>({} as IPCServerMethods)
