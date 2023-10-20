import { ApiClient } from '../api/ApiClient'
import React from 'react'
/** Used to communicate with the backend */
export const IPCServerContext = React.createContext<ApiClient>({} as ApiClient)
