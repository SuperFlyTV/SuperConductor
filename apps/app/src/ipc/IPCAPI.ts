import { PartialDeep } from 'type-fest'
import { BridgeStatus } from '../models/project/Bridge'
import { Project } from '../models/project/Project'
import { ResourceAny } from '@shared/models'
import { Rundown } from '../models/rundown/Rundown'
import { TimelineObj } from '../models/rundown/TimelineObj'
import { Part } from '../models/rundown/Part'
import { Group } from '../models/rundown/Group'
import { AppData } from '../models/App/AppData'
import { PeripheralArea, PeripheralStatus } from '../models/project/Peripheral'
import { ActiveTrigger, ActiveTriggers, ProjectTrigger, RundownTrigger } from '../models/rundown/Trigger'
import { LogLevel } from '@shared/api'
import { MoveTarget } from '../lib/util'
import { CurrentSelectionAny } from '../lib/GUI'

export const MAX_UNDO_LEDGER_LENGTH = 100

export const enum ActionDescription {
	NewPart = 'create new part',
	InsertParts = 'insert part(s)',
	UpdatePart = 'update part',
	SetPartTrigger = 'Assign trigger',
	NewGroup = 'create new group',
	InsertGroups = 'insert group(s)',
	UpdateGroup = 'update group',
	DeletePart = 'delete part',
	DeleteGroup = 'delete group',
	MovePart = 'move part',
	MoveGroup = 'move group',
	UpdateTimelineObj = 'update timeline object',
	DeleteTimelineObj = 'delete timeline object',
	AddTimelineObj = 'add timeline obj',
	addResourcesToTimeline = 'add resource to timeline',
	ToggleGroupLoop = 'toggle group loop',
	ToggleGroupAutoplay = 'toggle group autoplay',
	toggleGroupOneAtATime = 'toggle group one-at-a-time',
	ToggleGroupDisable = 'toggle group disable',
	ToggleGroupLock = 'toggle group lock',
	NewRundown = 'new rundown',
	DeleteRundown = 'delete rundown',
	OpenRundown = 'open rundown',
	CloseRundown = 'close rundown',
	RenameRundown = 'rename rundown',
	MoveTimelineObjToNewLayer = 'move timeline object to new layer',
	CreateMissingMapping = 'create missing layer',
	DuplicateGroup = 'duplicate group',
	DuplicatePart = 'duplicate part',
	AddPeripheralArea = 'Add button area',
	UpdatePeripheralArea = 'Update button area',
	RemovePeripheralArea = 'Remove button area',
	AssignAreaToGroup = 'Assign Area to Group',
	SetProjectTrigger = 'Assign trigger',
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
	log: (method: LogLevel, ...args: any[]) => void
	triggerSendAll: () => void
	triggerSendRundown: (arg: { rundownId: string }) => void
	setKeyboardKeys(arg: { activeKeys: ActiveTrigger[] }): void
	makeDevData(): void

	acknowledgeSeenVersion: () => void
	updateGUISelection: (selection: Readonly<CurrentSelectionAny[]>) => void

	playPart: (arg: { rundownId: string; groupId: string; partId: string; resume?: boolean }) => void
	pausePart: (arg: { rundownId: string; groupId: string; partId: string; pauseTime?: number }) => void
	stopPart: (arg: { rundownId: string; groupId: string; partId: string }) => void
	setPartTrigger: (arg: {
		rundownId: string
		groupId: string
		partId: string
		trigger: RundownTrigger | null
		triggerIndex: number | null
	}) => void
	stopGroup: (arg: { rundownId: string; groupId: string }) => void
	playGroup: (arg: { rundownId: string; groupId: string }) => void
	pauseGroup: (arg: { rundownId: string; groupId: string }) => void
	playNext: (arg: { rundownId: string; groupId: string }) => void
	playPrev: (arg: { rundownId: string; groupId: string }) => void
	newPart: (arg: {
		rundownId: string
		/** The group to create the part into. If null; will create a "transparent group" */
		groupId: string | null

		name: string
	}) => { partId: string; groupId?: string }
	insertParts: (arg: {
		rundownId: string
		groupId: string | null
		parts: { part: Part; resources: ResourceAny[] }[]
		target: MoveTarget
	}) => {
		groupId: string
		partId: string
	}[]
	updatePart: (arg: { rundownId: string; groupId: string; partId: string; part: Partial<Part> }) => void
	newGroup: (arg: { rundownId: string; name: string }) => string
	insertGroups: (arg: {
		rundownId: string
		groups: {
			group: Group
			resources: {
				[partId: string]: ResourceAny[]
			}
		}[]
		target: MoveTarget
	}) => {
		groupId: string
	}[]
	updateGroup: (arg: { rundownId: string; groupId: string; group: PartialDeep<Group> }) => void
	deletePart: (arg: { rundownId: string; groupId: string; partId: string }) => void
	deleteGroup: (arg: { rundownId: string; groupId: string }) => void
	moveParts: (arg: {
		parts: { rundownId: string; partId: string }[]
		to: { rundownId: string; groupId: string | null; target: MoveTarget }
	}) => { partId: string; groupId: string; rundownId: string }[]
	duplicatePart: (data: { rundownId: string; groupId: string; partId: string }) => void
	moveGroups: (data: { rundownId: string; groupIds: string[]; target: MoveTarget }) => void
	duplicateGroup: (data: { rundownId: string; groupId: string }) => void

	updateTimelineObj: (arg: {
		rundownId: string
		groupId: string
		partId: string
		timelineObjId: string
		timelineObj: {
			resourceId?: TimelineObj['resourceId']
			obj: Partial<TimelineObj['obj']>
		}
	}) => void
	deleteTimelineObj: (arg: { rundownId: string; groupId: string; partId: string; timelineObjId: string }) => void
	insertTimelineObjs: (arg: {
		rundownId: string
		groupId: string
		partId: string
		timelineObjs: TimelineObj[]
		target: MoveTarget | null
	}) => {
		groupId: string
		partId: string
		timelineObjId: string
	}[]
	moveTimelineObjToNewLayer: (arg: {
		rundownId: string
		groupId: string
		partId: string
		timelineObjId: string
	}) => void
	addResourcesToTimeline: (arg: {
		rundownId: string
		groupId: string
		partId: string

		layerId: string | null
		resourceIds: (string | ResourceAny)[]
	}) => void

	toggleGroupLoop: (arg: { rundownId: string; groupId: string; value: boolean }) => void
	toggleGroupAutoplay: (arg: { rundownId: string; groupId: string; value: boolean }) => void
	toggleGroupOneAtATime: (arg: { rundownId: string; groupId: string; value: boolean }) => void
	toggleGroupDisable: (arg: { rundownId: string; groupId: string; value: boolean }) => void
	toggleGroupLock: (arg: { rundownId: string; groupId: string; value: boolean }) => void
	refreshResources: () => void
	refreshResourcesSetAuto: (interval: number) => void
	triggerHandleAutoFill: () => void

	updateProject: (arg: { id: string; project: Project }) => void

	newRundown: (arg: { name: string }) => void
	deleteRundown: (arg: { rundownId: string }) => void
	openRundown: (arg: { rundownId: string }) => void
	closeRundown: (arg: { rundownId: string }) => void
	listRundowns: (arg: { projectId: string }) => { fileName: string; version: number; name: string; open: boolean }[]
	renameRundown: (arg: { rundownId: string; newName: string }) => void
	isRundownPlaying: (arg: { rundownId: string }) => boolean
	isTimelineObjPlaying: (arg: { rundownId: string; timelineObjId: string }) => boolean

	createMissingMapping: (arg: { rundownId: string; mappingId: string }) => void

	addPeripheralArea: (arg: { bridgeId: string; deviceId: string }) => void
	removePeripheralArea: (arg: { bridgeId: string; deviceId: string; areaId: string }) => void
	updatePeripheralArea: (arg: {
		bridgeId: string
		deviceId: string
		areaId: string
		update: Partial<PeripheralArea>
	}) => void
	assignAreaToGroup: (arg: {
		groupId: string | undefined
		areaId: string
		bridgeId: string
		deviceId: string
	}) => void

	startDefiningArea: (arg: { bridgeId: string; deviceId: string; areaId: string }) => void
	finishDefiningArea: () => void
	setProjectTrigger: (arg: {
		triggerAction: ProjectTrigger['action']
		trigger: ProjectTrigger | null
		triggerIndex: number | null
	}) => void
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
