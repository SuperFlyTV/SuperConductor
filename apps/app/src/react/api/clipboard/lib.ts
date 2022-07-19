import { Project } from '../../../models/project/Project'
import { IPCServer } from '../IPCServer'

export interface ClipBoardContext {
	project?: Project
	serverAPI: IPCServer
	handleError: (error: unknown) => void
}
