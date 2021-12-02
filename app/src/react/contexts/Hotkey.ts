import sorensen, { Sorensen } from '@sofie-automation/sorensen'
import React from 'react'
/** Used to communicate with the backend */
export const HotkeyContext = React.createContext<Sorensen>(sorensen)
