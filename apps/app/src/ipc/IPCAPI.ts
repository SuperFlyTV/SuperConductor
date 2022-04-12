import { BridgeStatus } from '../models/project/Bridge'
import { Project } from '../models/project/Project'
import { ResourceAny } from '@shared/models'
import { Rundown } from '../models/rundown/Rundown'
import { TimelineObj } from '../models/rundown/TimelineObj'
import { Part } from '../models/rundown/Part'
import { Group } from '../models/rundown/Group'
import { AppData } from '../models/App/AppData'
import { PeripheralStatus } from '../models/project/Peripheral'
import { ActiveTriggers, Trigger } from '../models/rundown/Trigger'

export const MAX_UNDO_LEDGER_LENGTH = 100

export const enum ActionDescription {
	NewPart = 'create new part',
	UpdatePart = 'update part',
	SetPartTrigger = 'Assign trigger',
	TogglePartLoop = 'toggle part loop',
	TogglePartDisable = 'toggle part disable',
	TogglePartLock = 'toggle part lock',
	NewGroup = 'create new group',
	UpdateGroup = 'update group',
	DeletePart = 'delete part',
	DeleteGroup = 'delete group',
	MovePart = 'move part',
	MoveGroup = 'move group',
	UpdateTimelineObj = 'update timeline object',
	DeleteTimelineObj = 'delete timeline object',
	AddTimelineObj = 'add timeline obj',
	NewTemplateData = 'add new template data',
	UpdateTemplateData = 'update template data',
	DeleteTemplateData = 'delete template data',
	AddResourceToTimeline = 'add resource to timeline',
	ToggleGroupLoop = 'toggle group loop',
	ToggleGroupAutoplay = 'toggle group autoplay',
	toggleGroupOneAtATime = 'toggle group one-at-a-time',
	ToggleGroupDisable = 'toggle group disable',
	ToggleGroupLock = 'toggle group lock',
	ToggleGroupCollapse = 'toggle group collapse',
	NewRundown = 'new rundown',
	DeleteRundown = 'delete rundown',
	OpenRundown = 'open rundown',
	CloseRundown = 'close rundown',
	RenameRundown = 'rename rundown',
	MoveTimelineObjToNewLayer = 'move timeline object to new layer',
	CreateMissingMapping = 'create missing layer',
	AddPeripheralArea = 'Add button area',
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

	acknowledgeSeenVersion: () => Promise<unknown>
	playPart: (data: { rundownId: string; groupId: string; partId: string; resume?: boolean }) => Promise<unknown>
	pausePart: (data: { rundownId: string; groupId: string; partId: string; pauseTime?: number }) => Promise<unknown>
	stopPart: (data: { rundownId: string; groupId: string; partId: string }) => Promise<unknown>
	setPartTrigger: (data: {
		rundownId: string
		groupId: string
		partId: string
		trigger: Trigger | null
		triggerIndex: number | null
	}) => Promise<unknown>
	togglePartLoop: (data: { rundownId: string; groupId: string; partId: string; value: boolean }) => Promise<unknown>
	togglePartDisable: (data: {
		rundownId: string
		groupId: string
		partId: string
		value: boolean
	}) => Promise<unknown>
	togglePartLock: (data: { rundownId: string; groupId: string; partId: string; value: boolean }) => Promise<unknown>
	stopGroup: (data: { rundownId: string; groupId: string }) => Promise<unknown>
	playGroup: (data: { rundownId: string; groupId: string }) => Promise<unknown>
	pauseGroup: (data: { rundownId: string; groupId: string }) => Promise<unknown>
	playNext: (data: { rundownId: string; groupId: string }) => Promise<unknown>
	playPrev: (data: { rundownId: string; groupId: string }) => Promise<unknown>
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
		from: { rundownId: string; partId: string }
		to: { rundownId: string; groupId: string | null; position: number }
	}) => Promise<unknown>
	moveGroup: (data: { rundownId: string; groupId: string; position: number }) => Promise<unknown>

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
	addTimelineObj: (data: {
		rundownId: string
		groupId: string
		partId: string
		timelineObjId: string
		timelineObj: TimelineObj
	}) => Promise<unknown>
	moveTimelineObjToNewLayer: (data: {
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
	toggleGroupDisable: (data: { rundownId: string; groupId: string; value: boolean }) => Promise<unknown>
	toggleGroupLock: (data: { rundownId: string; groupId: string; value: boolean }) => Promise<unknown>
	toggleGroupCollapse: (data: { rundownId: string; groupId: string; value: boolean }) => Promise<unknown>
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
	isRundownPlaying: (data: { rundownId: string }) => Promise<unknown>

	createMissingMapping: (data: { rundownId: string; mappingId: string }) => Promise<unknown>

	addPeripheralArea(data: { bridgeId: string; peripheralId: string }): Promise<unknown>
}
export interface IPCClientMethods {
	updateAppData: (appData: AppData) => void
	updateProject: (project: Project) => void
	updateRundown: (fileName: string, rundown: Rundown) => void
	updateResources: (resources: Array<{ id: string; resource: ResourceAny | null }>) => void
	updateBridgeStatus: (id: string, status: BridgeStatus | null) => void
	updatePeripheral: (peripheralId: string, peripheral: PeripheralStatus | null) => void
	updatePeripheralTriggers: (peripheralTriggers: ActiveTriggers) => void
}
