import React from 'react'
import { Rundown } from '../../models/rundown/Rundown'

export const RundownContext = React.createContext<Rundown>({} as Rundown)
