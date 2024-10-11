import React from 'react'
import { Project } from '../../models/project/Project.js'

export const ProjectContext = React.createContext<Project>({} as Project)
