import React from 'react'
import { ResourceAny } from '../../models/resource/resource'

export const ResourcesContext = React.createContext<Resources>({} as Resources)

export interface Resources {
	[resourceId: string]: ResourceAny
}
