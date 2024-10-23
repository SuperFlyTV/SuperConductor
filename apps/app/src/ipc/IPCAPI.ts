import type { PartialDeep } from 'type-fest'
import type { BridgeStatus } from '../models/project/Bridge.js'
import type { Project, SerializableLedger } from '../models/project/Project.js'
import type { ResourceAny, ResourceId, MetadataAny, SerializedProtectedMap, TSRDeviceId } from '@shared/models'
import type { Rundown } from '../models/rundown/Rundown.js'
import type { TimelineObj } from '../models/rundown/TimelineObj.js'
import type { Part } from '../models/rundown/Part.js'
import type { Group } from '../models/rundown/Group.js'
import type { AppData } from '../models/App/AppData.js'
import type { PeripheralArea, PeripheralStatus } from '../models/project/Peripheral.js'
import type { ActiveTrigger, ActiveTriggers, ApplicationTrigger, RundownTrigger } from '../models/rundown/Trigger.js'
import type { BridgeId, LogLevel, PeripheralId } from '@shared/api'
import type { MoveTarget } from '../lib/util.js'
import type { CurrentSelectionAny } from '../lib/GUI.js'
import type { ActiveAnalog } from '../models/rundown/Analog.js'
import type { AnalogInput } from '../models/project/AnalogInput.js'
import type { ValidatorCache } from 'graphics-data-definition'
import type { BridgePeripheralId } from '@shared/lib'
import type { DefiningArea } from '../lib/triggers/keyDisplay/keyDisplay.js'
import type { EverythingService } from '../electron/EverythingService.js'
import type { PartService } from '../electron/api/PartService.js'
import type { ProjectService } from '../electron/api/ProjectService.js'
import type { ReportingService } from '../electron/api/ReportingService.js'
import type { RundownService } from '../electron/api/RundownService.js'
import type { GroupService } from '../electron/api/GroupService.js'
import type { SpecialLedgers } from '../models/project/Project.js'

export enum ServiceName {
	GROUPS = 'groups',
	LEGACY = 'legacy',
	PARTS = 'parts',
	PROJECTS = 'projects',
	REPORTING = 'reporting',
	RUNDOWNS = 'rundowns',
}

export type ServiceTypes = {
	[ServiceName.GROUPS]: GroupService
	[ServiceName.LEGACY]: EverythingService
	[ServiceName.PARTS]: PartService
	[ServiceName.PROJECTS]: ProjectService
	[ServiceName.REPORTING]: ReportingService
	[ServiceName.RUNDOWNS]: RundownService
}

type KeyArrays<T> = {
	[K in keyof T]: Array<keyof T[K]>
}

type ServiceKeyArrays = KeyArrays<ServiceTypes>

// TODO: this is temporary; Use decorators or something
// those are the arrays of service methods exposed to the clients
export const ClientMethods: ServiceKeyArrays = {
	[ServiceName.GROUPS]: [
		'create', // POST
		'update', // PUT
		'remove', // DELETE
		'duplicate',
		'insert',
		'move',
		'play',
		'pause',
		'stop',
		'playNext',
		'playPrev',
	],
	[ServiceName.LEGACY]: [],
	[ServiceName.PARTS]: [
		'play',
		'stop',
		'pause',
		'move',
		'duplicate',
		'create',
		'update',
		'remove',
		'insert',
		'setPartTrigger',

		'addResourcesToTimeline',
		'deleteTimelineObj',
		'insertTimelineObjs',
	],
	[ServiceName.PROJECTS]: [
		'find',
		'get',
		'create',
		'update',
		'getAll',
		'open',
		'import',
		'export',
		'unsubscribe',
		'undo',
		'redo',
	],
	[ServiceName.REPORTING]: [
		'log',
		'handleClientError',
		'debugThrowError',
		'acknowledgeSeenVersion',
		'acknowledgeUserAgreement',
	],
	[ServiceName.RUNDOWNS]: [
		'find',
		'get',
		'create',
		'remove',
		'rename',
		'unsubscribe',
		'isPlaying',
		'close',
		'open',
		'updateTimelineObj',
		'moveTimelineObjToNewLayer',
	],
}

export const enum ActionDescription {
	NewPart = 'Create new part',
	InsertParts = 'Insert part(s)',
	UpdatePart = 'Update part',
	SetPartTrigger = 'Assign trigger',
	NewGroup = 'Create new group',
	InsertGroups = 'Insert group(s)',
	UpdateGroup = 'Update group',
	DeletePart = 'Delete part',
	DeleteGroup = 'Delete group',
	MovePart = 'Move part',
	MoveGroup = 'Move group',
	UpdateTimelineObj = 'Update timeline object',
	DeleteTimelineObj = 'Delete timeline object',
	AddTimelineObj = 'Add timeline obj',
	addResourcesToTimeline = 'Add resource to timeline',
	ToggleGroupLoop = 'Toggle group loop',
	ToggleGroupAutoplay = 'Toggle group autoplay',
	toggleGroupOneAtATime = 'Toggle group one-at-a-time',
	ToggleGroupDisable = 'Toggle group disable',
	ToggleGroupLock = 'Toggle group lock',
	ToggleGroupCollapse = 'Toggle group collapse',
	ToggleAllGroupsCollapse = 'Toggle all groups collapse',
	NewRundown = 'New rundown',
	DeleteRundown = 'Delete rundown',
	OpenRundown = 'Open rundown',
	CloseRundown = 'Close rundown',
	RenameRundown = 'Rename rundown',
	MoveTimelineObjToNewLayer = 'Move timeline object to new layer',
	CreateMissingMapping = 'Create missing layer',
	DuplicateGroup = 'Duplicate group',
	DuplicatePart = 'Duplicate part',
	AddPeripheralArea = 'Add button area',
	UpdatePeripheralArea = 'Update button area',
	RemovePeripheralArea = 'Remove button area',
	AssignAreaToGroup = 'Assign Area to Group',
	// eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
	SetApplicationTrigger = 'Assign trigger',
	UpsertGroup = 'Upsert group',
	UpsertPart = 'Upsert part',
}

export type UndoFunction = () => Promise<void> | void

export type UndoableResult<T = unknown> = {
	ledgerKey: string | SpecialLedgers
	undo: UndoFunction
	description: ActionDescription
	result?: T
}

export type UndoableFunction = (...args: any[]) => Promise<UndoableResult>

export interface Action {
	description: ActionDescription
	arguments: any[]
	redo: UndoableFunction
	undo: UndoFunction
}

export interface ElectronAPI {
	updateUndoLedger: (key: string, data: SerializableLedger) => void
}

// --- legacy
/** Methods that can be called on the server, by the client */
export interface IPCServerMethods {
	// Note: All these methods must only accept a single parameter.
	// This is so they can properly be exposed to the REST API.

	log: (arg: { level: LogLevel; params: any[] }) => void
	handleClientError: (arg: { error: string; stack?: string }) => void
	debugThrowError: (arg: { type: 'sync' | 'async' | 'setTimeout' }) => void
	installUpdate: () => void
	triggerSendAll: () => void
	setKeyboardKeys(arg: { activeKeys: ActiveTrigger[] }): void
	makeDevData(): void

	acknowledgeSeenVersion: () => void
	acknowledgeUserAgreement: (arg: { agreementVersion: string }) => void

	fetchGDDCache: () => Promise<ValidatorCache | null>
	storeGDDCache: (arg: { cache: ValidatorCache }) => Promise<void>

	updateGUISelection: (arg: { selection: Readonly<CurrentSelectionAny[]> }) => void
	exportProject: () => void
	importProject: () => void
	newProject: () => { name: string; id: string }
	listProjects: () => { name: string; id: string }[]
	openProject: (arg: { projectId: string }) => void

	playPart: (arg: { rundownId: string; groupId: string; partId: string; resume?: boolean }) => Rundown
	pausePart: (arg: { rundownId: string; groupId: string; partId: string; pauseTime?: number }) => Rundown
	stopPart: (arg: { rundownId: string; groupId: string; partId: string }) => Rundown
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
		timelineObj: PartialDeep<Omit<TimelineObj, 'resolved'>>
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
	toggleGroupCollapse: (arg: { rundownId: string; groupId: string; value: boolean }) => void
	toggleAllGroupsCollapse: (arg: { rundownId: string; value: boolean }) => void
	refreshResources: () => void
	refreshResourcesSetAuto: (arg: { interval: number }) => void
	triggerHandleAutoFill: () => void

	updateAppData: (arg: UpdateAppDataOptions) => void
	updateProject: (arg: { id: string; project: Project }) => Project

	newRundown: (arg: { name: string }) => Rundown
	deleteRundown: (arg: { rundownId: string }) => void
	openRundown: (arg: { rundownId: string }) => void
	closeRundown: (arg: { rundownId: string }) => void
	renameRundown: (arg: { rundownId: string; newName: string }) => string
	isRundownPlaying: (arg: { rundownId: string }) => boolean
	isTimelineObjPlaying: (arg: { rundownId: string; timelineObjId: string }) => boolean

	createMissingMapping: (arg: { rundownId: string; mappingId: string }) => void

	addPeripheralArea: (arg: { bridgeId: BridgeId; deviceId: PeripheralId }) => void
	removePeripheralArea: (arg: { bridgeId: BridgeId; deviceId: PeripheralId; areaId: string }) => void
	updatePeripheralArea: (arg: {
		bridgeId: BridgeId
		deviceId: PeripheralId
		areaId: string
		update: Partial<PeripheralArea>
	}) => void
	assignAreaToGroup: (arg: {
		groupId: string | undefined
		areaId: string
		bridgeId: BridgeId
		deviceId: PeripheralId
	}) => void

	startDefiningArea: (arg: { bridgeId: BridgeId; deviceId: PeripheralId; areaId: string }) => void
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
		metadata: SerializedProtectedMap<TSRDeviceId, MetadataAny | null>
	) => void
	updateBridgeStatus: (id: BridgeId, status: BridgeStatus | null) => void
	updatePeripheral: (peripheralId: BridgePeripheralId, peripheral: PeripheralStatus | null) => void
	updatePeripheralTriggers: (peripheralTriggers: ActiveTriggers) => void
	updatePeripheralAnalog: (fullIdentifier: string, analog: ActiveAnalog | null) => void
	updateFailedGlobalTriggers: (identifiers: string[]) => void
	updateAnalogInput: (fullIdentifier: string, analogInput: AnalogInput | null) => void
	updateDeviceRefreshStatus: (deviceId: TSRDeviceId, refreshing: boolean) => void
	updateDefiningArea: (area: DefiningArea | null) => void
}

export interface SystemMessageOptions {
	variant?: 'default' | 'error' | 'success' | 'warning' | 'info'
	key?: string
	persist?: boolean
	displayRestartButton?: boolean
}
export type UpdateAppDataOptions = Pick<AppData, 'preReleaseAutoUpdate' | 'guiDecimalCount'>

export enum RundownsEvents {
	UPDATED = 'updated',
}
export enum ProjectsEvents {
	UPDATED = 'updated',
	UNDO_LEDGERS_UPDATED = 'undo_ledgers_updated',
}
