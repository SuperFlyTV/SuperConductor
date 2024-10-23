import { ApiClient } from '../api/ApiClient.js'
import React from 'react'
/** Used to communicate with the backend */
export const IPCServerContext = React.createContext<ApiClient>({} as ApiClient)
