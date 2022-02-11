import { BridgeStatus } from '../models/project/Bridge'
import { Project } from '../models/project/Project'
import { ResourceAny } from '@shared/models'
import { Rundown } from '../models/rundown/Rundown'
import { TimelineObj } from '../models/rundown/TimelineObj'
import { Part } from '../models/rundown/Part'
import { Group } from '../models/rundown/Group'
import { AppData } from '../models/App/AppData'
import { Peripheral } from '../models/project/Peripheral'
import { ActiveTriggers, Trigger } from '../models/rundown/Trigger'

export const MAX_UNDO_LEDGER_LENGTH = 100

export const enum ActionDescription {
	NewPart = 'create new part',
	UpdatePart = 'update part',
	SetPartTrigger = 'Assign trigger',
	NewGroup = 'create new group',
	UpdateGroup = 'update group',
	DeletePart = 'delete part',
	DeleteGroup = 'delete group',
	MovePart = 'move part',
	UpdateTimelineObj = 'update timeline object',
	DeleteTimelineObj = 'delete timeline object',
	NewTemplateData = 'add new template data',
	UpdateTemplateData = 'update template data',
	DeleteTemplateData = 'delete template data',
	AddResourceToTimeline = 'add resource to timeline',
	ToggleGroupLoop = 'toggle group loop',
	ToggleGroupAutoplay = 'toggle group autoplay',
	toggleGroupOneAtATime = 'toggle group one-at-a-time',
	NewRundown = 'new rundown',
	DeleteRundown = 'delete rundown',
	OpenRundown = 'open rundown',
	CloseRundown = 'close rundown',
	RenameRundown = 'rename rundown',
}

export type UndoFunction = () => Promise<void> | void

export type UndoableResult<T = unknown> = { undo: UndoFunction; description: ActionDescription; result?: T }

export type UndoableFunction = (...args: any[]) => Promise<UndoableResult>

export interface Action {
	description: ActionDescription
	arguments: any[]
	redo: UndoableFunction
	undo: UndoFunction
}

/** Methods that can be called on the server, by the client */
export interface IPCServerMethods {
	triggerSendAll: () => Promise<unknown>
	triggerSendRundown: (data: { rundownId: string }) => Promise<unknown>

	playPart: (data: { rundownId: string; groupId: string; partId: string }) => Promise<unknown>
	stopPart: (data: { rundownId: string; groupId: string; partId: string }) => Promise<unknown>
	setPartTrigger: (data: {
		rundownId: string
		groupId: string
		partId: string
		trigger: Trigger | null
		triggerIndex: number | null
	}) => Promise<unknown>
	stopGroup: (data: { rundownId: string; groupId: string }) => Promise<unknown>
	newPart: (data: {
		rundownId: string
		/** The group to create the part into. If null; will create a "transparent group" */
		groupId: string | null

		name: string
	}) => Promise<unknown>
	updatePart: (data: { rundownId: string; groupId: string; partId: string; part: Part }) => Promise<unknown>
	newGroup: (data: { rundownId: string; name: string }) => Promise<unknown>
	updateGroup: (data: { rundownId: string; groupId: string; group: Group }) => Promise<unknown>
	deletePart: (data: { rundownId: string; groupId: string; partId: string }) => Promise<unknown>
	deleteGroup: (data: { rundownId: string; groupId: string }) => Promise<unknown>
	movePart: (data: {
		from: { rundownId: string; groupId: string; partId: string }
		to: { rundownId: string; groupId: string | null; position: number }
	}) => Promise<unknown>

	updateTimelineObj: (data: {
		rundownId: string
		groupId: string
		partId: string
		timelineObjId: string
		timelineObj: TimelineObj
	}) => Promise<unknown>
	deleteTimelineObj: (data: {
		rundownId: string
		groupId: string
		partId: string
		timelineObjId: string
	}) => Promise<unknown>
	addResourceToTimeline: (data: {
		rundownId: string
		groupId: string
		partId: string

		layerId: string | null
		resourceId: string
	}) => Promise<unknown>

	newTemplateData: (data: {
		rundownId: string
		groupId: string
		partId: string

		timelineObjId: string
	}) => Promise<unknown>
	updateTemplateData: (data: {
		rundownId: string
		groupId: string
		partId: string

		timelineObjId: string
		key: string
		changedItemId: string
		value: string
	}) => Promise<unknown>
	deleteTemplateData: (data: {
		rundownId: string
		groupId: string
		partId: string

		timelineObjId: string
		key: string
	}) => Promise<unknown>

	toggleGroupLoop: (data: { rundownId: string; groupId: string; value: boolean }) => Promise<unknown>
	toggleGroupAutoplay: (data: { rundownId: string; groupId: string; value: boolean }) => Promise<unknown>
	refreshResources: () => Promise<unknown>

	updateProject: (data: { id: string; project: Project }) => Promise<unknown>

	newRundown: (data: { name: string }) => Promise<unknown>
	deleteRundown: (data: { rundownId: string }) => Promise<unknown>
	openRundown: (data: { rundownId: string }) => Promise<unknown>
	closeRundown: (data: { rundownId: string }) => Promise<unknown>
	listRundowns: (data: {
		projectId: string
	}) => Promise<{ fileName: string; version: number; name: string; open: boolean }[]>
	renameRundown: (data: { rundownId: string; newName: string }) => Promise<unknown>
}
export interface IPCClientMethods {
	updateAppData: (appData: AppData) => void
	updateProject: (project: Project) => void
	updateRundown: (fileName: string, rundown: Rundown) => void
	updateResource: (id: string, resource: ResourceAny | null) => void
	updateBridgeStatus: (id: string, status: BridgeStatus | null) => void
	updatePeripheral: (peripheralId: string, peripheral: Peripheral | null) => void
	updatePeripheralTriggers: (peripheralTriggers: ActiveTriggers) => void
	openSettings: () => void
}
