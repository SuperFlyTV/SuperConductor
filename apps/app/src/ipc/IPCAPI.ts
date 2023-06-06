import { PartialDeep } from 'type-fest'
import { BridgeStatus } from '../models/project/Bridge'
import { Project } from '../models/project/Project'
import { ResourceAny, ResourceId, MetadataAny } from '@shared/models'
import { Rundown } from '../models/rundown/Rundown'
import { TimelineObj } from '../models/rundown/TimelineObj'
import { Part } from '../models/rundown/Part'
import { Group } from '../models/rundown/Group'
import { AppData } from '../models/App/AppData'
import { PeripheralArea, PeripheralStatus } from '../models/project/Peripheral'
import { ActiveTrigger, ActiveTriggers, ApplicationTrigger, RundownTrigger } from '../models/rundown/Trigger'
import { LogLevel } from '@shared/api'
import { MoveTarget } from '../lib/util'
import { CurrentSelectionAny } from '../lib/GUI'
import { ActiveAnalog } from '../models/rundown/Analog'
import { AnalogInput } from '../models/project/AnalogInput'
import { ValidatorCache } from 'graphics-data-definition'

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
	// eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
	SetApplicationTrigger = 'Assign trigger',
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
	// Note: All these methods must only accept a single parameter.
	// This is so they can properly be exposed to the REST API.

	log: (arg: { level: LogLevel; params: any[] }) => void
	handleClientError: (arg: { error: string; stack?: string }) => void
	debugThrowError: (arg: { type: 'sync' | 'async' | 'setTimeout' }) => void
	installUpdate: () => void
	triggerSendAll: () => void
	triggerSendRundown: (arg: { rundownId: string }) => void
	setKeyboardKeys(arg: { activeKeys: ActiveTrigger[] }): void
	makeDevData(): void

	acknowledgeSeenVersion: () => void
	acknowledgeUserAgreement: (arg: { agreementVersion: string }) => void

	fetchGDDCache: () => Promise<ValidatorCache | null>
	storeGDDCache: (arg: { cache: ValidatorCache }) => Promise<void>

	updateGUISelection: (arg: { selection: Readonly<CurrentSelectionAny[]> }) => void
	exportProject: () => void
	importProject: () => void
	newProject: () => void
	listProjects: () => { name: string; id: string }[]
	openProject: (arg: { projectId: string }) => void

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
	duplicatePart: (arg: { rundownId: string; groupId: string; partId: string }) => void
	moveGroups: (arg: { rundownId: string; groupIds: string[]; target: MoveTarget }) => void
	duplicateGroup: (arg: { rundownId: string; groupId: string }) => void

	updateTimelineObj: (arg: {
		rundownId: string
		groupId: string
		partId: string
		timelineObjId: string
		timelineObj: {
			obj: PartialDeep<TimelineObj['obj']>
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
		resourceIds: (ResourceId | ResourceAny)[]
	}) => void

	toggleGroupLoop: (arg: { rundownId: string; groupId: string; value: boolean }) => void
	toggleGroupAutoplay: (arg: { rundownId: string; groupId: string; value: boolean }) => void
	toggleGroupOneAtATime: (arg: { rundownId: string; groupId: string; value: boolean }) => void
	toggleGroupDisable: (arg: { rundownId: string; groupId: string; value: boolean }) => void
	toggleGroupLock: (arg: { rundownId: string; groupId: string; value: boolean }) => void
	refreshResources: () => void
	refreshResourcesSetAuto: (arg: { interval: number }) => void
	triggerHandleAutoFill: () => void

	updateAppData: (arg: UpdateAppDataOptions) => void
	updateProject: (arg: { id: string; project: Project }) => void

	newRundown: (arg: { name: string }) => string
	deleteRundown: (arg: { rundownId: string }) => void
	openRundown: (arg: { rundownId: string }) => void
	closeRundown: (arg: { rundownId: string }) => void
	renameRundown: (arg: { rundownId: string; newName: string }) => string
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
	setApplicationTrigger: (arg: {
		triggerAction: ApplicationTrigger['action']
		trigger: ApplicationTrigger | null
		triggerIndex: number | null
	}) => void
}
export interface IPCClientMethods {
	systemMessage: (message: string, options: SystemMessageOptions) => void
	updateAppData: (appData: AppData) => void
	updateProject: (project: Project) => void
	updateRundown: (fileName: string, rundown: Rundown) => void
	updateResourcesAndMetadata: (
		resources: Array<{ id: ResourceId; resource: ResourceAny | null }>,
		metadata: { [deviceId: string]: MetadataAny }
	) => void
	updateBridgeStatus: (id: string, status: BridgeStatus | null) => void
	updatePeripheral: (peripheralId: string, peripheral: PeripheralStatus | null) => void
	updatePeripheralTriggers: (peripheralTriggers: ActiveTriggers) => void
	updatePeripheralAnalog: (fullIdentifier: string, analog: ActiveAnalog | null) => void
	updateFailedGlobalTriggers: (identifiers: string[]) => void
	updateAnalogInput: (fullIdentifier: string, analogInput: AnalogInput | null) => void
}

export interface SystemMessageOptions {
	variant?: 'default' | 'error' | 'success' | 'warning' | 'info'
	key?: string
	persist?: boolean
	displayRestartButton?: boolean
}
export type UpdateAppDataOptions = Pick<AppData, 'preReleaseAutoUpdate' | 'guiDecimalCount'>
