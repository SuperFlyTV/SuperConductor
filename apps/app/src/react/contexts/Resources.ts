import React from 'react'
import { ResourceAny } from '@shared/models'

export const ResourcesContext = React.createContext<Resources>({} as Resources)

export interface Resources {
	[resourceId: string]: ResourceAny
}
