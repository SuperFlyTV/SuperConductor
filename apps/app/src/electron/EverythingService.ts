import * as fs from 'fs'
import { dialog } from 'electron'
import {
	allowAddingResourceToLayer,
	allowMovingPartIntoGroup,
	copyGroup,
	copyPart,
	deepExtendRemovingUndefined,
	deleteGroup,
	deletePart,
	deleteTimelineObj,
	findGroup,
	findGroupByExternalId,
	findPartInGroup,
	findPartInGroupByExternalId,
	findPartInRundown,
	findTimelineObj,
	findTimelineObjIndex,
	findTimelineObjInRundown,
	getMappingName,
	getNextPartIndex,
	getPositionFromTarget,
	getPrevPartIndex,
	has,
	isLayerInfinite,
	listAvailableDeviceIDs,
	MoveTarget,
	shortID,
	updateGroupPlayingParts,
} from '../lib/util'
import { PartialDeep } from 'type-fest'
import deepExtend from 'deep-extend'
import { Group, PlayingPart } from '../models/rundown/Group'
import { Part } from '../models/rundown/Part'
import {
	TSRTimelineObj,
	Mapping,
	DeviceType,
	MappingCasparCG,
	TSRTimelineContent,
	DeviceOptionsAny,
} from 'timeline-state-resolver-types'
import { ActionDescription, IPCServerMethods, UndoableResult, UpdateAppDataOptions } from '../ipc/IPCAPI'
import { GroupPreparedPlayData } from '../models/GUI/PreparedPlayhead'
import { convertToFilename, ExportProjectData, StorageHandler } from './storageHandler'
import { Rundown } from '../models/rundown/Rundown'
import { SessionHandler } from './sessionHandler'
import {
	isProtectedString,
	protectString,
	ResourceAny,
	ResourceId,
	ResourceType,
	TSRDeviceId,
	unprotectString,
} from '@shared/models'
import { assertNever, deepClone, getResourceIdFromTimelineObj, omit } from '@shared/lib'
import { TimelineObj } from '../models/rundown/TimelineObj'
import { Project, ProjectBase } from '../models/project/Project'
import { AppData } from '../models/App/AppData'
import {
	filterMapping,
	getMappingFromTimelineObject,
	guessDeviceIdFromTimelineObject,
	sortMappings,
} from '../lib/TSRMappings'
import { getDefaultGroup, getDefaultPart } from '../lib/defaults'
import { ActiveTrigger, ApplicationTrigger, RundownTrigger } from '../models/rundown/Trigger'
import { getGroupPlayData } from '../lib/playout/groupPlayData'
import { TSRTimelineObjFromResource } from '../lib/resources'
import { PeripheralArea } from '../models/project/Peripheral'
import { DefiningArea } from '../lib/triggers/keyDisplay/keyDisplay'
import { BridgeId, LoggerLike, LogLevel, PeripheralId } from '@shared/api'
import { postProcessPart } from './rundown'
import _ from 'lodash'
import { getLastEndTime } from '../lib/partTimeline'
import { CurrentSelectionAny } from '../lib/GUI'
import { Bridge, BridgePeripheralSettings } from '../models/project/Bridge'
import { TriggersHandler } from './triggersHandler'
import { GDDSchema, ValidatorCache } from 'graphics-data-definition'
import * as RundownActions from './rundownActions'
import { SuperConductor } from './SuperConductor'
import { UndoLedgerKey, UndoLedgerService } from './UndoService'
import { SpecialLedgers } from '../models/project/Project'

export function isUndoable(result: unknown): result is UndoableResult<any> {
	if (typeof result !== 'object' || result === null) {
		return false
	}

	if (typeof (result as any).undo !== 'function') {
		return false
	}

	if (typeof (result as any).description !== 'string') {
		return false
	}

	return true
}

type ConvertToServerSide<T> = {
	[K in keyof T]: T[K] extends (arg: any) => any
		? (
				...args: Parameters<T[K]>
		  ) => Promise<UndoableResult<ReturnType<T[K]>> | undefined> | Promise<ReturnType<T[K]>> | ReturnType<T[K]>
		: T[K]
}

function Undoable(target: EverythingService, _key: string, descriptor: PropertyDescriptor) {
	const originalMethod = descriptor.value
	descriptor.value = async function (...args: any) {
		const result = await originalMethod.apply(this, args)
		if (isUndoable(result)) {
			target.pushUndoable.call(this, result.ledgerKey, args, originalMethod.bind(this), result)
		}
		return result
	}
	return descriptor
}

/**
 * This class is used server-side, to handle requests from the client
 * The methods in here will later be moved away to other Services
 */
export class EverythingService implements ConvertToServerSide<IPCServerMethods> {
	public triggers?: TriggersHandler

	constructor(
		private _log: LoggerLike,
		private _renderLog: LoggerLike,
		private storage: StorageHandler,
		private superConductor: SuperConductor,
		private session: SessionHandler,
		private undoService: UndoLedgerService,
		private callbacks: {
			onClientConnected: () => void
			installUpdate: () => void
			updateTimeline: (group: Group) => GroupPreparedPlayData | null
			updatePeripherals: () => void
			refreshResources: () => void
			refreshResourcesSetAuto: (interval: number) => void
			setKeyboardKeys: (activeKeys: ActiveTrigger[]) => void
			makeDevData: () => Promise<void>
			triggerHandleAutoFill: () => void
			onAgreeToUserAgreement: () => void
			handleError: (error: string, stack?: string) => void
		}
	) {}

	public pushUndoable(key: UndoLedgerKey, args: unknown[], fcn: () => any, result: UndoableResult): void {
		this.undoService.pushUndoable(key, args, fcn, result)
	}

	public getProject(): Project {
		return this.storage.getProject()
	}
	public getRundowns(): { rundownIds: string[] } {
		const rundowns = this.storage.getAllRundowns()
		return { rundownIds: rundowns.map((r) => r.id) }
	}
	public getRundown(arg: { rundownId: string }): { rundown: Rundown } {
		const rundown = this.storage.getRundown(arg.rundownId)
		if (!rundown) throw new Error(`Rundown "${arg.rundownId}" not found.`)

		return { rundown }
	}
	private getGroup(arg: { rundownId: string; groupId: string }): { rundown: Rundown; group: Group } {
		const { rundown } = this.getRundown(arg)

		return this._getGroupOfRundown(rundown, arg.groupId)
	}
	private getGroupByExternalId(arg: { rundownId: string; externalId: string }): { rundown: Rundown; group: Group } {
		const { rundown } = this.getRundown(arg)

		return this._getGroupOfRundownByExternalId(rundown, arg.externalId)
	}
	private _getGroupOfRundown(rundown: Rundown, groupId: string): { rundown: Rundown; group: Group } {
		const group = findGroup(rundown, groupId)
		if (!group) throw new Error(`Group ${groupId} not found in rundown "${rundown.id}" ("${rundown.name}").`)

		return { rundown, group }
	}
	private _getGroupOfRundownByExternalId(rundown: Rundown, externalId: string): { rundown: Rundown; group: Group } {
		const group = findGroupByExternalId(rundown, externalId)
		if (!group)
			throw new Error(
				`Group with external ID ${externalId} not found in rundown "${rundown.id}" ("${rundown.name}").`
			)

		return { rundown, group }
	}

	private getPart(arg: { rundownId: string; groupId: string; partId: string }): {
		rundown: Rundown
		group: Group
		part: Part
	} {
		const { rundown, group } = this.getGroup(arg)
		const part = findPartInGroup(group, arg.partId)
		if (!part) throw new Error(`Part ${arg.partId} not found in group ${group.id} ("${group.name}").`)

		return { rundown, group, part }
	}

	private getPartByExternalId(arg: { rundownId: string; groupId: string; externalId: string }): {
		rundown: Rundown
		group: Group
		part: Part
	} {
		const { rundown, group } = this.getGroup(arg)
		const part = findPartInGroupByExternalId(group, arg.externalId)
		if (!part)
			throw new Error(`Part with external ID ${arg.externalId} not found in group ${group.id} ("${group.name}").`)

		return { rundown, group, part }
	}

	async undo(key: string): Promise<void> {
		await this.undoService.undo(key)
	}
	async redo(key: string): Promise<void> {
		await this.undoService.redo(key)
	}

	async log(arg: { level: LogLevel; params: any[] }): Promise<void> {
		this._renderLog[arg.level](arg.params[0], ...arg.params.slice(1))
	}
	async handleClientError(arg: { error: string; stack?: string }): Promise<void> {
		// Handle an error thrown in the client
		this.callbacks.handleError('Client error: ' + arg.error, arg.stack)
	}
	async debugThrowError(arg: { type: 'sync' | 'async' | 'setTimeout' }): Promise<void> {
		// This method is used for development-purposes only, to check how error reporting works.

		if (arg.type === 'sync') {
			throw new Error('This is an error in an IPC method')
		} else if (arg.type === 'async') {
			await new Promise((_, reject) => {
				setTimeout(() => {
					reject(new Error('This is an error in a promise'))
				}, 10)
			})
		} else if (arg.type === 'setTimeout') {
			setTimeout(() => {
				throw new Error('This is an error in a setTImeout')
			}, 10)
		} else {
			assertNever(arg.type)
		}
	}
	async installUpdate(): Promise<void> {
		this.callbacks.installUpdate()
	}
	async triggerSendAll(): Promise<void> {
		this.storage.triggerEmitAll()
		this.session.triggerEmitAll()
		this.triggers?.triggerEmitAll()

		this.callbacks.onClientConnected()
	}
	async setKeyboardKeys(arg: { activeKeys: ActiveTrigger[] }): Promise<void> {
		this.callbacks.setKeyboardKeys(arg.activeKeys)
	}
	async makeDevData(): Promise<void> {
		await this.callbacks.makeDevData()
	}

	async acknowledgeSeenVersion(): Promise<void> {
		const appData = this.storage.getAppData()
		appData.version.seenVersion = appData.version.currentVersion

		this.storage.updateAppData(appData)
	}
	async acknowledgeUserAgreement(arg: { agreementVersion: string }): Promise<void> {
		const appData = this.storage.getAppData()
		appData.userAgreement = arg.agreementVersion

		this.storage.updateAppData(appData)
		if (arg.agreementVersion) {
			this.callbacks.onAgreeToUserAgreement()
		}
	}
	async updateGUISelection(arg: { selection: Readonly<CurrentSelectionAny[]> }): Promise<void> {
		this.session.updateSelection(arg.selection)
	}
	async fetchGDDCache(): Promise<ValidatorCache | null> {
		return this.storage.getGDDCache()
	}
	async storeGDDCache(arg: { cache: ValidatorCache }): Promise<void> {
		await this.storage.updateGDDCache(arg.cache)
	}

	async exportProject(): Promise<void> {
		// TODO: this won't work, needs to return project to the WS client
		const result = await dialog.showSaveDialog({
			title: 'Export Project',
			defaultPath: `${convertToFilename(this.storage.getProject().name) || 'SuperConductor'}.project.json`,
			buttonLabel: 'Save',
			filters: [
				{ name: 'Project files', extensions: ['project.json'] },
				{ name: 'All Files', extensions: ['*'] },
			],
			properties: ['showOverwriteConfirmation'],
		})

		if (!result.canceled) {
			if (result.filePath) {
				const exportData = JSON.stringify(this.storage.getProjectForExport())

				await fs.promises.writeFile(result.filePath, exportData, 'utf-8')
			}
		}
	}
	async importProject(): Promise<void> {
		// TODO: this won't work, needs to return project to the WS client
		const result = await dialog.showOpenDialog({
			title: 'Import Project',
			buttonLabel: 'Import',
			filters: [
				{ name: 'Project files', extensions: ['project.json'] },
				{ name: 'All Files', extensions: ['*'] },
			],
			properties: ['openFile'],
		})
		if (!result.canceled) {
			const filePath = result.filePaths[0]
			if (filePath) {
				const exportDataStr = await fs.promises.readFile(filePath, 'utf-8')
				let exportData: ExportProjectData | undefined = undefined
				try {
					exportData = JSON.parse(exportDataStr)
				} catch (err) {
					throw new Error(`Invalid project file (error: ${err})`)
				}
				if (exportData) {
					await this.storage.importProject(exportData)
				}
			}
		}
	}
	async newProject(): Promise<ProjectBase> {
		return await this.storage.newProject('New Project')
	}
	async listProjects(): Promise<{ name: string; id: string }[]> {
		return this.storage.listProjects()
	}
	async openProject(arg: { projectId: string }): Promise<void> {
		return this.storage.openProject(arg.projectId)
	}

	async playPart(arg: { rundownId: string; groupId: string; partId: string }): Promise<Rundown> {
		const now = Date.now()
		const { rundown, group, part } = this.getPart(arg)

		RundownActions.playPart(group, part, now)

		this._saveUpdates({ rundownId: arg.rundownId, rundown, group })
		return rundown // this should return something more granular (group or part)
	}

	async pausePart(arg: { rundownId: string; groupId: string; partId: string; time?: number }): Promise<Rundown> {
		const now = Date.now()
		const { rundown, group, part } = this.getPart(arg)
		updateGroupPlayingParts(group)
		RundownActions.pausePart(group, part, arg.time, now)

		this._saveUpdates({ rundownId: arg.rundownId, rundown, group })
		return rundown
	}

	async pauseParts(arg: { rundownId: string; groupId: string; partIds: string[]; time?: number }): Promise<void> {
		const now = Date.now()
		const { rundown, group } = this.getGroup({
			rundownId: arg.rundownId,
			groupId: arg.groupId,
		})
		updateGroupPlayingParts(group)
		for (const partId of arg.partIds) {
			const part = findPartInGroup(group, partId)
			if (!part) throw new Error(`Part ${partId} not found in group ${group.id} ("${group.name}").`)

			RundownActions.pausePart(group, part, arg.time, now)

			// group.preparedPlayData
		}

		this._saveUpdates({ rundownId: arg.rundownId, rundown, group })
	}

	async stopPart(arg: { rundownId: string; groupId: string; partId: string }): Promise<Rundown> {
		const now = Date.now()
		const { rundown, group } = this.getGroup(arg)

		RundownActions.stopPart(group, arg.partId, now)

		this._saveUpdates({ rundownId: arg.rundownId, rundown, group })
		return rundown
	}

	@Undoable
	async setPartTrigger(arg: {
		rundownId: string
		groupId: string
		partId: string
		trigger: RundownTrigger | null
		triggerIndex: number | null
	}): Promise<UndoableResult<void> | undefined> {
		const { rundown, group, part } = this.getPart(arg)

		if (group.locked || part.locked) {
			return
		}

		const originalTriggers = deepClone(part.triggers)

		if (arg.triggerIndex === null) {
			// Replace any existing triggers:
			part.triggers = arg.trigger ? [arg.trigger] : []
		} else {
			// Modify a trigger:
			if (!arg.trigger) {
				part.triggers.splice(arg.triggerIndex, 1)
			} else {
				const triggerToEdit = part.triggers[arg.triggerIndex]
				if (triggerToEdit) {
					part.triggers[arg.triggerIndex] = arg.trigger
				} else {
					part.triggers.push(arg.trigger)
				}
			}
		}
		this._saveUpdates({ rundownId: arg.rundownId, rundown, noEffectOnPlayout: true })
		return {
			undo: () => {
				const { rundown, part } = this.getPart(arg)
				part.triggers = originalTriggers
				this._saveUpdates({ rundownId: arg.rundownId, rundown, noEffectOnPlayout: true })
			},
			description: ActionDescription.SetPartTrigger,
			ledgerKey: arg.rundownId,
		}
	}
	async stopGroup(arg: { rundownId: string; groupId: string }): Promise<void> {
		const now = Date.now()
		const { rundown, group } = this.getGroup(arg)

		// Stop the group:
		RundownActions.stopGroup(group, now)

		this._saveUpdates({ rundownId: arg.rundownId, rundown, group })
	}
	async playGroup(arg: { rundownId: string; groupId: string }): Promise<void> {
		const { rundown, group } = this.getGroup(arg)

		if (group.disabled) return

		const now = Date.now()

		RundownActions.playGroup(group, now)

		this._saveUpdates({ rundownId: arg.rundownId, rundown, group })
	}
	async pauseGroup(arg: { rundownId: string; groupId: string }): Promise<void> {
		const { group } = this.getGroup(arg)

		if (group.disabled) {
			return
		}

		updateGroupPlayingParts(group)

		if (group.oneAtATime) {
			let partId: string | undefined

			const playingPartId = Object.keys(group.playout.playingParts)[0] as string | undefined
			if (playingPartId) {
				// Cue / Pause / resume the currently playing part
				partId = playingPartId
				// Cue / Pause / resume the first non-disabled part
			} else {
				const firstPart = group.parts.find((p) => !p.disabled)
				if (firstPart) partId = firstPart.id
				else partId = undefined
			}

			if (partId) {
				this.pausePart({ rundownId: arg.rundownId, groupId: arg.groupId, partId: partId }).catch(
					this._log.error
				)
			}
		} else {
			const playingPartIds = Object.keys(group.playout.playingParts)
			if (playingPartIds.length === 0) {
				// Cue all parts
				this.pauseParts({
					rundownId: arg.rundownId,
					groupId: arg.groupId,
					partIds: group.parts.map((part) => part.id),
				}).catch(this._log.error)
			} else {
				// Pause / resume all parts (disabled parts won't get played)
				this.pauseParts({
					rundownId: arg.rundownId,
					groupId: arg.groupId,
					partIds: playingPartIds,
				}).catch(this._log.error)
			}
		}
	}
	async playNext(arg: { rundownId: string; groupId: string }): Promise<void> {
		const { group } = this.getGroup(arg)

		if (group.disabled || !group.oneAtATime) {
			return
		}
		updateGroupPlayingParts(group)
		const nextPartIndex = getNextPartIndex(group)
		const nextPart = group.parts[nextPartIndex]
		if (nextPart) {
			await this.playPart({ rundownId: arg.rundownId, groupId: arg.groupId, partId: nextPart.id })
		}
	}
	async playPrev(arg: { rundownId: string; groupId: string }): Promise<void> {
		const { group } = this.getGroup(arg)

		if (group.disabled || !group.oneAtATime) {
			return
		}
		updateGroupPlayingParts(group)
		const prevPartIndex = getPrevPartIndex(group)
		const prevPart = group.parts[prevPartIndex]
		if (prevPart) {
			await this.playPart({ rundownId: arg.rundownId, groupId: arg.groupId, partId: prevPart.id })
		}
	}
	@Undoable
	async newPart(arg: {
		rundownId: string
		/** The group to create the part into. If null; will create a "transparent group" */
		groupId: string | null

		name: string
	}): Promise<UndoableResult<{ partId: string; groupId?: string }> | undefined> {
		const newPart: Part = {
			...getDefaultPart(),
			id: shortID(),
			name: arg.name,
		}

		const { rundown } = this.getRundown(arg)

		let transparentGroupId: string | undefined
		if (arg.groupId) {
			// Put part into existing group:
			const { group } = this.getGroup({ rundownId: arg.rundownId, groupId: arg.groupId })

			if (group.locked) {
				return
			}

			group.parts.push(newPart)
		} else {
			// Create a new "transparent group":
			const newGroup: Group = {
				...getDefaultGroup(),
				id: shortID(),
				name: arg.name,
				transparent: true,
				parts: [newPart],
			}
			transparentGroupId = newGroup.id
			rundown.groups.push(newGroup)
		}
		this._saveUpdates({ rundownId: arg.rundownId, rundown })

		const result: { partId: string; groupId?: string } = {
			partId: newPart.id,
		}
		if (transparentGroupId) {
			result.groupId = transparentGroupId
		}
		return {
			undo: () => {
				const { rundown } = this.getRundown(arg)
				if (transparentGroupId) {
					// Remove the entire group.
					rundown.groups = rundown.groups.filter((g) => g.id !== transparentGroupId)
				} else if (arg.groupId) {
					// Remove the part from its group.
					const { group } = this.getGroup({ rundownId: arg.rundownId, groupId: arg.groupId })
					group.parts = group.parts.filter((p) => p.id !== newPart.id)
				}
				this._saveUpdates({ rundownId: arg.rundownId, rundown })
			},
			description: ActionDescription.NewPart,
			result,
			ledgerKey: arg.rundownId,
		}
	}
	@Undoable
	async insertParts(arg: {
		rundownId: string
		groupId: string | null
		parts: { part: Part; resources: ResourceAny[] }[]
		target: MoveTarget
	}): Promise<
		UndoableResult<
			{
				groupId: string
				partId: string
			}[]
		>
	> {
		if (arg.groupId) {
			const inserted: {
				groupId: string
				partId: string
			}[] = []
			const arg2 = {
				rundownId: arg.rundownId,
				groupId: arg.groupId,
			}
			const { rundown, group } = this.getGroup(arg2)

			if (group.transparent) {
				// Oh, we can't add Parts to a transparent group.
				// add them to the side instead:
				return this._insertPartsAsTransparentGroup({
					rundownId: arg.rundownId,
					parts: arg.parts,
					target: {
						type: 'after',
						id: group.id,
					},
				})
			}

			// Save the original positions for use in undo:
			const originalPartIds = group.parts.map((g) => g.id)

			let nextTarget: MoveTarget = arg.target
			for (const part of arg.parts) {
				// Ensure that the part id is unique:
				for (const g of rundown.groups) {
					for (const p of g.parts) {
						if (p.id === part.part.id) throw new Error(`part id is already in use: ${part.part.id}`)
					}
				}

				const insertPosition = getPositionFromTarget(nextTarget, group.parts)
				group.parts.splice(insertPosition, 0, part.part)
				nextTarget = {
					type: 'after',
					id: part.part.id,
				}
				inserted.push({
					groupId: group.id,
					partId: part.part.id,
				})
			}

			this._saveUpdates({ rundownId: arg.rundownId, rundown })

			// Now, also add the resources as timeline-objects into the parts:
			const addedResourcesUndo: (() => void | Promise<void>)[] = []
			for (const part of arg.parts) {
				if (part.resources.length) {
					const r = await this.addResourcesToTimeline({
						rundownId: arg.rundownId,
						groupId: arg.groupId,
						partId: part.part.id,
						resourceIds: part.resources,
						layerId: null,
					})
					if (r) addedResourcesUndo.push(r.undo)
				}
			}

			return {
				undo: async () => {
					addedResourcesUndo.reverse()
					for (const undo of addedResourcesUndo) {
						await undo()
					}

					const { rundown, group } = this.getGroup(arg2)
					const parts = group.parts
					group.parts = []
					for (const partId of originalPartIds) {
						const part = parts.find((p) => p.id === partId)
						if (part) group.parts.push(part)
					}
					this._saveUpdates({ rundownId: arg.rundownId, rundown, group })
				},
				description: ActionDescription.InsertParts,
				result: inserted,
				ledgerKey: arg.rundownId,
			}
		} else {
			return this._insertPartsAsTransparentGroup({
				rundownId: arg.rundownId,
				parts: arg.parts,
				target: arg.target,
			})
		}
	}
	@Undoable
	private async _insertPartsAsTransparentGroup(arg: {
		rundownId: string
		parts: { part: Part; resources: ResourceAny[] }[]
		target: MoveTarget
	}): Promise<
		UndoableResult<
			{
				groupId: string
				partId: string
			}[]
		>
	> {
		const inserted: {
			groupId: string
			partId: string
		}[] = []
		const groups: {
			group: Group
			resources: {
				[partId: string]: ResourceAny[]
			}
		}[] = []
		for (const part of arg.parts) {
			// Create a new "transparent group":
			const newGroup: Group = {
				...getDefaultGroup(),
				id: shortID(),
				name: part.part.name,
				transparent: true,
				parts: [part.part],
			}
			groups.push({
				group: newGroup,
				resources: {
					[part.part.id]: part.resources,
				},
			})
			inserted.push({
				groupId: newGroup.id,
				partId: part.part.id,
			})
		}
		const r = await this.insertGroups({
			rundownId: arg.rundownId,
			groups,
			target: arg.target,
		})

		return {
			...r,
			result: inserted,
			ledgerKey: arg.rundownId,
		}
	}
	@Undoable
	async updatePart(arg: {
		rundownId: string
		groupId: string
		partId: string
		part: Partial<Part>
	}): Promise<UndoableResult<void> | undefined> {
		const { rundown, group, part } = this.getPart(arg)

		if (group.locked) {
			return
		}

		if (part.locked && !has(arg.part, 'locked')) {
			return
		}

		let affectsPlayout: Group | undefined = undefined
		if (has(arg.part, 'loop') || has(arg.part, 'disabled') || has(arg.part, 'duration')) {
			affectsPlayout = group
		}

		if (affectsPlayout) {
			updateGroupPlayingParts(group)
		}

		const partPreChange = deepClone(part)
		Object.assign(part, arg.part)

		postProcessPart(part)
		this._saveUpdates({ rundownId: arg.rundownId, rundown, group: affectsPlayout })

		return {
			undo: () => {
				const { rundown, part } = this.getPart(arg)

				Object.assign(part, partPreChange)

				postProcessPart(part)
				this._saveUpdates({ rundownId: arg.rundownId, rundown })
			},
			description: ActionDescription.UpdatePart,
			ledgerKey: arg.rundownId,
		}
	}
	@Undoable
	async upsertPart(arg: {
		rundownId: string
		groupId: string
		partId: string | undefined
		part: Partial<Part>
	}): Promise<UndoableResult<void> | undefined> {
		const { group } = this.getGroup(arg)
		let existingPart: Part | undefined
		if (arg.partId) {
			try {
				const result = this.getPart({ rundownId: arg.rundownId, groupId: arg.groupId, partId: arg.partId })
				existingPart = result.part
			} catch (_error) {
				// Discard error.
			}
		}

		let partIdToUpdate = arg.partId
		let newPartResult:
			| UndoableResult<{
					partId: string
					groupId?: string | undefined
			  }>
			| undefined

		if (!existingPart) {
			newPartResult = await this.newPart({
				rundownId: arg.rundownId,
				groupId: arg.groupId,
				name: arg.part.name ?? `Part #${group.parts.length + 1}`,
			})
			partIdToUpdate = newPartResult?.result?.partId
		}

		if (!partIdToUpdate) {
			throw new Error('Failed to upsert part because no partId was provided, located, or generated.')
		}

		const updatePartResult = await this.updatePart({
			rundownId: arg.rundownId,
			groupId: arg.groupId,
			partId: partIdToUpdate,
			part: {
				...arg.part,
				id: partIdToUpdate,
			},
		})

		return {
			undo: async () => {
				if (updatePartResult) {
					await updatePartResult.undo()
				}

				if (newPartResult) {
					await newPartResult.undo()
				}
			},
			description: ActionDescription.UpsertPart,
			ledgerKey: arg.rundownId,
		}
	}
	@Undoable
	async upsertPartByExternalId(arg: {
		rundownId: string
		groupId: string
		externalId: string
		part: Partial<Part>
	}): Promise<UndoableResult<void> | undefined> {
		let partId: string | undefined
		try {
			const { part } = this.getPartByExternalId(arg)
			partId = part.id
		} catch (error) {
			// Discard error.
		}

		return this.upsertPart({
			rundownId: arg.rundownId,
			groupId: arg.groupId,
			partId,
			part: arg.part,
		})
	}
	@Undoable
	async newGroup(arg: { rundownId: string; name: string }): Promise<UndoableResult<string>> {
		const newGroup: Group = {
			...getDefaultGroup(),
			id: shortID(),
			name: arg.name,
		}
		const { rundown } = this.getRundown(arg)

		rundown.groups.push(newGroup)
		this._saveUpdates({ rundownId: arg.rundownId, rundown })

		return {
			undo: () => {
				const { rundown } = this.getRundown(arg)
				rundown.groups = rundown.groups.filter((g) => g.id !== newGroup.id)
				this._saveUpdates({ rundownId: arg.rundownId, rundown })
			},
			description: ActionDescription.NewGroup,
			result: newGroup.id,
			ledgerKey: arg.rundownId,
		}
	}
	@Undoable
	async insertGroups(arg: {
		rundownId: string
		groups: {
			group: Group
			resources: {
				[partId: string]: ResourceAny[]
			}
		}[]
		target: MoveTarget
	}): Promise<
		UndoableResult<
			{
				groupId: string
			}[]
		>
	> {
		const inserted: {
			groupId: string
		}[] = []
		const { rundown } = this.getRundown(arg)

		// Save the original positions for use in undo:
		const originalGroupIds = rundown.groups.map((group) => group.id)

		let nextTarget: MoveTarget = arg.target
		for (const group of arg.groups) {
			// Ensure that the group id is unique:
			if (rundown.groups.find((g) => g.id === group.group.id)) {
				throw new Error(`Group id is already in use: ${group.group.id}`)
			}

			for (const part of group.group.parts) {
				// Ensure that the part id is unique:
				for (const g of rundown.groups) {
					for (const p of g.parts) {
						if (p.id === part.id) throw new Error(`part id is already in use: ${part.id}`)
					}
				}
			}

			const insertPosition = getPositionFromTarget(nextTarget, rundown.groups)
			rundown.groups.splice(insertPosition, 0, group.group)
			nextTarget = {
				type: 'after',
				id: group.group.id,
			}
			inserted.push({
				groupId: group.group.id,
			})
		}

		this._saveUpdates({ rundownId: arg.rundownId, rundown })

		// Now, also add the resources as timeline-objects into the parts:
		const addedResourcesUndo: (() => void | Promise<void>)[] = []
		for (const group of arg.groups) {
			for (const part of group.group.parts) {
				const resources = group.resources[part.id]
				if (resources?.length) {
					const r = await this.addResourcesToTimeline({
						rundownId: arg.rundownId,
						groupId: group.group.id,
						partId: part.id,
						resourceIds: resources,
						layerId: null,
					})
					if (r) addedResourcesUndo.push(r.undo)
				}
			}
		}

		return {
			undo: async () => {
				addedResourcesUndo.reverse()
				for (const undo of addedResourcesUndo) {
					await undo()
				}

				const { rundown } = this.getRundown(arg)
				const groups = rundown.groups
				rundown.groups = []
				for (const groupId of originalGroupIds) {
					const group = groups.find((g) => g.id === groupId)
					if (group) rundown.groups.push(group)
				}
				this._saveUpdates({ rundownId: arg.rundownId, rundown })
			},
			description: ActionDescription.InsertGroups,
			result: inserted,
			ledgerKey: arg.rundownId,
		}
	}
	@Undoable
	async updateGroup(arg: {
		rundownId: string
		groupId: string
		group: PartialDeep<Group>
	}): Promise<UndoableResult<void> | undefined> {
		const { rundown, group } = this.getGroup(arg)

		if (group.locked) {
			return
		}

		const groupPreChange = deepClone(group)
		deepExtend(group, arg.group)

		let affectsPlayout: Group | undefined = undefined
		if (
			has(arg.group, 'schedule') ||
			has(arg.group, 'autoPlay') ||
			has(arg.group, 'loop') ||
			has(arg.group, 'disabled') ||
			has(arg.group, 'oneAtATime') ||
			has(arg.group, 'parts') ||
			has(arg.group, 'playout') ||
			has(arg.group, 'playoutMode')
		) {
			affectsPlayout = group
		}
		// Special Case: When scheduling is enabled, any prevous stop-times should be removed.
		// This is to allow a user to click Stop, then to resume schedule; Disable then Enable schedule.
		if (!groupPreChange.schedule?.activate && group.schedule?.activate) {
			for (const [partId, playingPart] of Object.entries<PlayingPart>(group.playout.playingParts)) {
				if (playingPart.stopTime) delete group.playout.playingParts[partId]
			}
		}

		this._saveUpdates({ rundownId: arg.rundownId, rundown, group: affectsPlayout })

		return {
			undo: () => {
				const { rundown, group } = this.getGroup(arg)

				// @TODO: Don't overwrite playout-related properties?
				Object.assign(group, groupPreChange)

				this._saveUpdates({ rundownId: arg.rundownId, rundown })
			},
			description: ActionDescription.UpdateGroup,
			ledgerKey: arg.rundownId,
		}
	}
	@Undoable
	async upsertGroup(arg: {
		rundownId: string
		groupId: string | undefined
		group: PartialDeep<Group>
		useExternalIdForParts?: boolean
	}): Promise<UndoableResult<void> | undefined> {
		const { rundown } = this.getRundown(arg)
		let existingGroup: Group | undefined
		if (arg.groupId) {
			try {
				const result = this.getGroup({ rundownId: arg.rundownId, groupId: arg.groupId })
				existingGroup = result.group
			} catch (_error) {
				// Discard error.
			}
		}

		let groupIdToUpdate = arg.groupId
		let newGroupResult: UndoableResult<string> | undefined
		if (!existingGroup) {
			newGroupResult = await this.newGroup({
				rundownId: arg.rundownId,
				name: arg.group.name ?? `Group #${rundown.groups.length + 1}`,
			})
			groupIdToUpdate = newGroupResult.result
		}

		if (!groupIdToUpdate) {
			throw new Error('Failed to upsert group because no groupId was provided, located, or generated.')
		}

		const updateGroupResult = await this.updateGroup({
			rundownId: arg.rundownId,
			groupId: groupIdToUpdate,
			group: {
				...omit(arg.group, 'parts'), // We'll update the parts next.
				id: groupIdToUpdate,
			},
		})

		const upsertPartResults: UndoableResult<void>[] = []
		for (const part of arg.group.parts ?? []) {
			let result: UndoableResult<void> | undefined
			if (arg.useExternalIdForParts) {
				if (!part.externalId) {
					throw new Error(`Part named "${part.name}" does not have an external ID`)
				}

				result = await this.upsertPartByExternalId({
					rundownId: arg.rundownId,
					groupId: groupIdToUpdate,
					externalId: part.externalId,
					part,
				})
			} else {
				if (!part.id) {
					throw new Error(`Part named "${part.name}" does not have an ID`)
				}

				result = await this.upsertPart({
					rundownId: arg.rundownId,
					groupId: groupIdToUpdate,
					partId: part.id,
					part,
				})
			}

			if (result) {
				upsertPartResults.push(result)
			}
		}

		return {
			undo: async () => {
				for (const result of upsertPartResults) {
					await result.undo()
				}

				if (updateGroupResult) {
					await updateGroupResult.undo()
				}

				if (newGroupResult) {
					await newGroupResult.undo()
				}
			},
			description: ActionDescription.UpsertGroup,
			ledgerKey: arg.rundownId,
		}
	}
	@Undoable
	async upsertGroupByExternalId(arg: {
		rundownId: string
		externalId: string
		group: PartialDeep<Group>
	}): Promise<UndoableResult<void> | undefined> {
		let groupId: string | undefined
		try {
			const { group } = this.getGroupByExternalId(arg)
			groupId = group.id
		} catch (error) {
			// Ignore error.
		}

		return this.upsertGroup({
			rundownId: arg.rundownId,
			groupId,
			group: arg.group,
			useExternalIdForParts: true,
		})
	}
	@Undoable
	async deletePart(arg: {
		rundownId: string
		groupId: string
		partId: string
	}): Promise<UndoableResult<void> | undefined> {
		const { rundown, group, part } = this.getPart(arg)

		if (group.locked || part.locked) {
			return
		}

		const deletedPartIndex = group.parts.findIndex((p) => p.id === arg.partId)
		const deletedPart = deletePart(group, arg.partId)

		let deletedTransparentGroupIndex = -1
		let deletedTransparentGroup: Group | undefined
		if (group.transparent && group.parts.length === 0) {
			deletedTransparentGroupIndex = rundown.groups.findIndex((g) => g.id === arg.groupId)
			deletedTransparentGroup = deleteGroup(rundown, group.id)
		}

		this._saveUpdates({ rundownId: arg.rundownId, rundown, group })

		return {
			undo: () => {
				if (!deletedPart) {
					return
				}

				const { rundown } = this.getRundown(arg)

				if (deletedTransparentGroup) {
					deletedTransparentGroup.parts.push(deletedPart)
					rundown.groups.splice(deletedTransparentGroupIndex, 0, deletedTransparentGroup)
				} else {
					const { group } = this.getGroup(arg)
					group.parts.splice(deletedPartIndex, 0, deletedPart)
				}

				this._saveUpdates({ rundownId: arg.rundownId, rundown })
			},
			description: ActionDescription.DeletePart,
			ledgerKey: arg.rundownId,
		}
	}
	@Undoable
	async deleteGroup(arg: { rundownId: string; groupId: string }): Promise<UndoableResult<void> | undefined> {
		const { rundown, group } = this.getGroup(arg)

		if (group.locked) {
			return
		}

		// Stop the group (so that the updates are sent to TSR):
		group.playout = {
			playingParts: {},
		}

		this._saveUpdates({ group })
		const deletedGroupIndex = rundown.groups.findIndex((g) => g.id === group.id)
		const deletedGroup = deleteGroup(rundown, group.id)
		this._saveUpdates({ rundownId: arg.rundownId, rundown, group })

		return {
			undo: () => {
				if (!deletedGroup) {
					return
				}

				const { rundown } = this.getRundown(arg)
				rundown.groups.splice(deletedGroupIndex, 0, deletedGroup)
				this._saveUpdates({ rundownId: arg.rundownId, rundown, group: deletedGroup })
			},
			description: ActionDescription.DeleteGroup,
			ledgerKey: arg.rundownId,
		}
	}
	@Undoable
	async moveParts(arg: {
		parts: { rundownId: string; partId: string }[]
		to: { rundownId: string; groupId: string | null; target: MoveTarget }
	}): Promise<UndoableResult<{ partId: string; groupId: string; rundownId: string }[]>> {
		// For Undo:
		const originalRundowns: Rundown[] = []

		const resultingParts: { partId: string; groupId: string; rundownId: string }[] = []

		const toRundown: Rundown = this.getRundown(arg.to).rundown
		originalRundowns.push(deepClone(toRundown))

		const rundownsToUpdate: Rundown[] = []
		const groupsToUpdate: Group[] = []

		let nextTarget: MoveTarget = arg.to.target
		for (const movePart of arg.parts) {
			const fromRundown = arg.to.rundownId === movePart.rundownId ? toRundown : this.getRundown(movePart).rundown
			if (fromRundown.id !== toRundown.id) {
				originalRundowns.push(deepClone(fromRundown))
			}

			const findPartResult = findPartInRundown(fromRundown, movePart.partId)
			if (!findPartResult) {
				throw new Error(`Part "${movePart.partId}" does not exist in rundown "${movePart.rundownId}"`)
			}
			const fromGroup = findPartResult.group
			const part = findPartResult.part

			let toGroup: Group
			let madeNewTransparentGroup = false
			const isTransparentGroupMove =
				movePart.rundownId === arg.to.rundownId && fromGroup.transparent && arg.to.groupId === null

			if (arg.to.groupId) {
				toGroup = this._getGroupOfRundown(toRundown, arg.to.groupId).group
			} else {
				// toRundown = arg.to.rundownId === movePart.rundownId ? fromRundown : this.getRundown(arg.to).rundown
				if (isTransparentGroupMove) {
					toGroup = fromGroup
				} else {
					toGroup = {
						...getDefaultGroup(),

						id: shortID(),
						name: part.name,
						transparent: true,

						parts: [part],
					}
					madeNewTransparentGroup = true
				}
			}
			if (!madeNewTransparentGroup && toGroup !== fromGroup && toGroup.transparent) {
				throw new Error('Cannot move a Part into an already-existing Transparent Group.')
			}
			const allow = allowMovingPartIntoGroup(movePart.partId, fromGroup, toGroup)

			if (!allow) {
				throw new Error('Move prohibited')
			}
			const fromPlayhead = allow.fromPlayhead
			const toPlayhead = allow.toPlayhead
			const movedPartIsPlaying = fromPlayhead.playheads[movePart.partId]

			if (madeNewTransparentGroup) {
				// Add the new transparent group to the rundown

				// Remove the part from its original group.
				fromGroup.parts = fromGroup.parts.filter((p) => p.id !== movePart.partId)

				const insertPosition = getPositionFromTarget(nextTarget, toRundown.groups)
				if (insertPosition === -1)
					throw new Error(
						`Internal error: group insertAfterId "${JSON.stringify(
							nextTarget
						)}" not found in rundown (new transparent)`
					)
				toRundown.groups.splice(insertPosition, 0, toGroup)

				nextTarget = { type: 'after', id: toGroup.id }
			} else if (isTransparentGroupMove) {
				// Move the transparent group to its new position.
				fromRundown.groups = fromRundown.groups.filter((g) => g.id !== toGroup.id)

				const insertPosition = getPositionFromTarget(nextTarget, toRundown.groups)

				if (insertPosition === -1)
					throw new Error(
						`Internal error: group insertAfterId "${JSON.stringify(
							nextTarget
						)}" not found in rundown (move transparent)`
					)
				toRundown.groups.splice(insertPosition, 0, toGroup)

				nextTarget = { type: 'after', id: toGroup.id }
			} else if (!isTransparentGroupMove) {
				// Add the part to its new group, in its new position

				// Remove the part from its original group.
				fromGroup.parts = fromGroup.parts.filter((p) => p.id !== movePart.partId)

				const insertPosition = getPositionFromTarget(nextTarget, toGroup.parts)

				if (insertPosition === -1)
					throw new Error(
						`Internal error: part insertAfterId "${nextTarget}" not found in group "${toGroup.id}"`
					)
				toGroup.parts.splice(insertPosition, 0, part)

				nextTarget = { type: 'after', id: part.id }
			}
			// Clean up leftover empty transparent groups.
			if (fromGroup.transparent && fromGroup.parts.length <= 0) {
				fromRundown.groups = fromRundown.groups.filter((group) => group.id !== fromGroup.id)
			}

			resultingParts.push({
				rundownId: toRundown.id,
				groupId: toGroup.id,
				partId: movePart.partId,
			})

			// Update timelines:
			if (!isTransparentGroupMove) {
				if (fromGroup.id === toGroup.id) {
					// Moving within the same group

					updateGroupPlayingParts(toGroup)
					if (movedPartIsPlaying && toGroup.oneAtATime) {
						// Update the group's playhead, so that the currently playing
						// part continues to play as if nothing happened:
						toGroup.playout.playingParts = {
							[movePart.partId]: {
								startTime: movedPartIsPlaying.partStartTime,
								pauseTime: movedPartIsPlaying.partPauseTime,
								stopTime: undefined,
								fromSchedule: movedPartIsPlaying.fromSchedule,
							},
						}
					}
					groupsToUpdate.push(fromGroup)
					rundownsToUpdate.push(fromRundown)
				} else {
					// Moving between groups
					if (movedPartIsPlaying && !toPlayhead.groupIsPlaying) {
						// Update the playhead, so that the currently playing
						// part continues to play as if nothing happened.
						// This means that the target Group will start playing
						// while the source Group stops.

						// Move over the playout-data:
						toGroup.playout.playingParts = fromGroup.playout.playingParts
						fromGroup.playout.playingParts = {}
					}
					groupsToUpdate.push(fromGroup, toGroup)
					rundownsToUpdate.push(fromRundown)
					if (fromRundown !== toRundown) {
						rundownsToUpdate.push(toRundown)
					}
				}
			} else {
				groupsToUpdate.push(toGroup)
				rundownsToUpdate.push(fromRundown)
				if (fromRundown !== toRundown) {
					rundownsToUpdate.push(toRundown)
				}
			}
		}

		// Commit the changes:
		this._saveUpdates({ group: _.uniq(groupsToUpdate) })
		for (const rundown of _.uniq(rundownsToUpdate)) {
			this._saveUpdates({ rundownId: rundown.id, rundown: rundown })
		}
		return {
			undo: async () => {
				for (const orgRundown of originalRundowns) {
					this._saveUpdates({ rundownId: orgRundown.id, rundown: orgRundown })
				}
			},
			description: ActionDescription.MovePart,
			result: resultingParts,
			ledgerKey: arg.to.rundownId,
		}
	}
	@Undoable
	async duplicatePart(arg: { rundownId: string; groupId: string; partId: string }): Promise<UndoableResult<void>> {
		const { rundown, group, part } = this.getPart(arg)

		// Make a copy of the part, give it and all its children unique IDs, and leave it at the original position.
		const copy = copyPart(part)

		let newGroup: Group | undefined = undefined
		if (group.transparent) {
			// We can't place the copy into the already-existing transparent group, so let's make a new one
			newGroup = {
				...getDefaultGroup(),

				id: shortID(),
				name: copy.name,
				transparent: true,

				parts: [copy],
			}

			// Add the new group just below the original in the rundown
			const position = rundown.groups.findIndex((g) => g.id === arg.groupId)
			rundown.groups.splice(position + 1, 0, newGroup)
		} else {
			// Add the copy just below the original in the group
			const position = group.parts.findIndex((p) => p.id === arg.partId)
			group.parts.splice(position + 1, 0, copy)
		}
		// Commit the changes:
		this._saveUpdates({ rundownId: arg.rundownId, rundown, group: newGroup || group })

		return {
			undo: async () => {
				const { rundown, group } = this.getGroup(arg)

				if (newGroup) {
					// Remove the group we added
					rundown.groups = rundown.groups.filter((g) => (newGroup ? g.id !== newGroup.id : true))
				} else {
					// Remove the part copy we added
					group.parts = group.parts.filter((p) => p.id !== copy.id)
					this._saveUpdates({ group })
				}

				// Commit the changes.
				this._saveUpdates({ rundownId: arg.rundownId, rundown, group: newGroup ? undefined : group })
			},
			description: ActionDescription.DuplicatePart,
			ledgerKey: arg.rundownId,
		}
	}
	@Undoable
	async moveGroups(arg: {
		rundownId: string
		groupIds: string[]
		target: MoveTarget
	}): Promise<UndoableResult<void>> {
		const { rundown } = this.getRundown(arg)

		// Save the original positions for use in undo:
		const originalGroupIds = rundown.groups.map((group) => group.id)

		let nextTarget: MoveTarget = arg.target
		for (const groupId of arg.groupIds) {
			// Remove the group from the groups array and re-insert it at its new position

			const group = this._getGroupOfRundown(rundown, groupId).group

			// Remove the group from the groups array and re-insert it at its new position
			rundown.groups = rundown.groups.filter((g) => g.id !== group.id)

			const insertPosition = getPositionFromTarget(nextTarget, rundown.groups)
			rundown.groups.splice(insertPosition, 0, group)
			nextTarget = {
				type: 'after',
				id: group.id,
			}
		}

		this._saveUpdates({ rundownId: arg.rundownId, rundown })

		return {
			undo: async () => {
				const { rundown } = this.getRundown(arg)
				const groups = rundown.groups
				rundown.groups = []
				for (const groupId of originalGroupIds) {
					const group = groups.find((g) => g.id === groupId)
					if (group) rundown.groups.push(group)
				}
				this._saveUpdates({ rundownId: arg.rundownId, rundown })
			},
			description: ActionDescription.MoveGroup,
			ledgerKey: arg.rundownId,
		}
	}
	@Undoable
	async duplicateGroup(arg: { rundownId: string; groupId: string }): Promise<UndoableResult<void>> {
		const { rundown, group } = this.getGroup(arg)

		// Make a copy of the group and give it and all its children unique IDs.
		const groupCopy = copyGroup(group)

		// Insert the copy just below the original.
		const originalPosition = rundown.groups.findIndex((g) => g.id === group.id)
		rundown.groups.splice(originalPosition + 1, 0, groupCopy)

		this._saveUpdates({ rundownId: arg.rundownId, rundown, group: [group, groupCopy] })

		return {
			undo: async () => {
				// Stop playout.
				await this.stopGroup({ rundownId: arg.rundownId, groupId: groupCopy.id })

				// Delete the copy we made.
				rundown.groups = rundown.groups.filter((g) => g.id !== groupCopy.id)

				this._saveUpdates({ rundownId: arg.rundownId, rundown })
			},
			description: ActionDescription.DuplicateGroup,
			ledgerKey: arg.rundownId,
		}
	}

	@Undoable
	async updateTimelineObj(arg: {
		rundownId: string
		groupId: string
		partId: string
		timelineObjId: string
		timelineObj: PartialDeep<Omit<TimelineObj, 'resolved'>>
	}): Promise<UndoableResult<void> | undefined> {
		const { rundown, group, part } = this.getPart(arg)

		if (group.locked || part.locked) {
			return
		}

		updateGroupPlayingParts(group)

		const timelineObj = findTimelineObj(part, arg.timelineObjId)
		if (!timelineObj) throw new Error(`TimelineObj ${arg.timelineObjId} not found.`)
		const timelineObjPreChange = deepClone(timelineObj)
		const timelineObjIndex = findTimelineObjIndex(part, arg.timelineObjId)

		if (arg.timelineObj.obj !== undefined) deepExtendRemovingUndefined(timelineObj.obj, arg.timelineObj.obj)
		if (arg.timelineObj.customLabel !== undefined) timelineObj.customLabel = arg.timelineObj.customLabel

		postProcessPart(part)
		this._saveUpdates({ rundownId: arg.rundownId, rundown, group })

		return {
			undo: () => {
				const { rundown, group, part } = this.getPart(arg)

				// Overwrite the changed timeline object with the pre-change copy we made.
				part.timeline.splice(timelineObjIndex, 1, timelineObjPreChange)
				postProcessPart(part)
				this._saveUpdates({ rundownId: arg.rundownId, rundown, group })
			},
			description: ActionDescription.UpdateTimelineObj,
			ledgerKey: arg.rundownId,
		}
	}

	@Undoable
	async deleteTimelineObj(arg: {
		rundownId: string
		groupId: string
		partId: string
		timelineObjId: string
	}): Promise<UndoableResult<void> | undefined> {
		const { rundown } = this.getRundown(arg)

		const result = findTimelineObjInRundown(rundown, arg.timelineObjId)
		if (!result) throw new Error(`TimelineObj ${arg.timelineObjId} not found.`)
		const { group, part } = result
		const groupId = group.id
		const partId = part.id

		if (group.locked || part.locked) {
			return
		}

		const originalPartTimeline = part.timeline
		const modifiedPartTimeline = deleteTimelineObj(originalPartTimeline, arg.timelineObjId)

		if (modifiedPartTimeline !== originalPartTimeline) {
			part.timeline = modifiedPartTimeline
			postProcessPart(part)
		}
		if (part.timeline.length <= 0)
			this.stopPart({ rundownId: arg.rundownId, groupId, partId }).catch(this._log.error)
		this._saveUpdates({ rundownId: arg.rundownId, rundown, group })

		return {
			undo: () => {
				const { rundown, group, part } = this.getPart({ rundownId: arg.rundownId, groupId, partId })

				// Replace with the original timeline.
				part.timeline = originalPartTimeline
				postProcessPart(part)
				this._saveUpdates({ rundownId: arg.rundownId, rundown, group })
			},
			description: ActionDescription.DeleteTimelineObj,
			ledgerKey: arg.rundownId,
		}
	}
	@Undoable
	async insertTimelineObjs(arg: {
		rundownId: string
		groupId: string
		partId: string
		timelineObjs: TimelineObj[]
		target: MoveTarget | null
	}): Promise<
		| UndoableResult<
				{
					groupId: string
					partId: string
					timelineObjId: string
				}[]
		  >
		| undefined
	> {
		const project = this.getProject()
		let updatedProject = false
		const addedNewLayers: string[] = []

		const { rundown, group, part } = this.getPart(arg)
		const inserted: {
			groupId: string
			partId: string
			timelineObjId: string
		}[] = []

		if (group.locked || part.locked) {
			return
		}

		let nextTarget: MoveTarget | null = arg.target
		for (const timelineObj of arg.timelineObjs) {
			const existingTimelineObj = findTimelineObj(part, timelineObj.obj.id)
			if (existingTimelineObj)
				throw new Error(`A timelineObj with the ID "${timelineObj.obj.id}" already exists.`)

			if (nextTarget) {
				const enable = Array.isArray(timelineObj.obj.enable)
					? timelineObj.obj.enable[0]
					: timelineObj.obj.enable
				if (nextTarget.type === 'first') {
					enable.start = 0
				} else if (nextTarget.type === 'last') {
					// Place the timelineObj at the end of the part's timeline:
					const lastEnd = getLastEndTime(part.timeline, `${timelineObj.obj.layer}`)
					enable.start = lastEnd.objId ? `#${lastEnd.objId}.end` : lastEnd.time
				} else if (
					nextTarget.type === 'after' ||
					nextTarget.type === 'before' // Note: 'before' is not supported at the moment, so we handle that as 'after' for now.
				) {
					const afterId = nextTarget.id
					const afterObj = part.timeline.find((t) => t.obj.id === afterId)
					if (!afterObj) throw new Error(`timelineObj with the ID "${afterId}" not found!`)

					enable.start = `#${afterObj.obj.id}.end`
				} else {
					assertNever(nextTarget)
				}
			}
			let layerMustBeFree = true
			if (timelineObj.obj.layer && !project.mappings[timelineObj.obj.layer]) {
				// If the layer doesn't exist, set to falsy to create a new one:
				timelineObj.obj.layer = ''
				layerMustBeFree = false
			}
			// Set a layer in case it doesn't exist:
			if (!timelineObj.obj.layer) {
				const result = this._findBestOrCreateLayer({
					project,
					rundown,
					part,
					obj: timelineObj.obj,
					resource: undefined,
					layerMustBeFree,
					originalLayerId: undefined,
				})

				if (result.createdNewLayer) {
					addedNewLayers.push(result.layerId)
					updatedProject = true
				}

				timelineObj.obj.layer = result.layerId
			}

			part.timeline.push(timelineObj)
			nextTarget = {
				type: 'after',
				id: timelineObj.obj.id,
			}
			inserted.push({
				groupId: group.id,
				partId: part.id,
				timelineObjId: timelineObj.obj.id,
			})

			postProcessPart(part)
		}
		const insertedTimelineObjIds = inserted.map((t) => t.timelineObjId)

		this._saveUpdates({ project: updatedProject ? project : undefined, rundownId: arg.rundownId, rundown, group })

		return {
			undo: () => {
				let updatedProject: Project | undefined = undefined
				if (addedNewLayers.length > 0) {
					// If a new layer was added, remove it.
					updatedProject = this.getProject()
					for (const layerId of addedNewLayers) {
						delete updatedProject.mappings[layerId]
					}
				}

				const { rundown, group, part } = this.getPart(arg)

				part.timeline = part.timeline.filter((obj) => !insertedTimelineObjIds.includes(obj.obj.id))

				postProcessPart(part)
				this._saveUpdates({ rundownId: arg.rundownId, rundown, group })
			},
			description: ActionDescription.AddTimelineObj,
			result: inserted,
			ledgerKey: arg.rundownId,
		}
	}
	@Undoable
	async moveTimelineObjToNewLayer(arg: {
		rundownId: string
		groupId: string
		partId: string
		timelineObjId: string
	}): Promise<UndoableResult<void> | undefined> {
		const { rundown, group, part } = this.getPart(arg)

		if (group.locked || part.locked) {
			return
		}

		const timelineObj = findTimelineObj(part, arg.timelineObjId)
		if (!timelineObj) throw new Error(`A timelineObj with the ID "${arg.timelineObjId}" could not be found.`)

		const project = this.getProject()
		const resourceId = getResourceIdFromTimelineObj(timelineObj.obj, project.mappings)
		const resource = resourceId && this.storage.getResource(resourceId)

		const originalLayer = timelineObj.obj.layer
		const result = this._findBestOrCreateLayer({
			project,
			rundown,
			part,
			obj: timelineObj.obj,
			resource: resource,
			layerMustBeFree: true,
			originalLayerId: originalLayer,
		})
		timelineObj.obj.layer = result.layerId

		postProcessPart(part)
		this._saveUpdates({ project, rundownId: arg.rundownId, rundown, group })

		return {
			undo: () => {
				let updatedProject: Project | undefined = undefined
				if (result.createdNewLayer) {
					// If a new layer was added, remove it.
					updatedProject = this.getProject()
					delete updatedProject.mappings[result.layerId]
				}

				const { rundown, group, part } = this.getPart(arg)

				timelineObj.obj.layer = originalLayer

				postProcessPart(part)
				this._saveUpdates({ project: updatedProject, rundownId: arg.rundownId, rundown, group })
			},
			description: ActionDescription.MoveTimelineObjToNewLayer,
			ledgerKey: arg.rundownId,
		}
	}

	@Undoable
	async addResourcesToTimeline(arg: {
		rundownId: string
		groupId: string
		partId: string
		layerId: string | null
		resourceIds: (ResourceId | ResourceAny)[]
	}): Promise<UndoableResult<void> | undefined> {
		const { rundown, group, part } = this.getPart(arg)

		if (group.locked || part.locked) {
			return
		}
		let updatedProject = false
		const project = this.getProject()
		const addedNewLayers: string[] = []
		const addedNewTimelineObjIds: string[] = []
		let usePreviousLayerId: string | undefined = undefined

		if (arg.resourceIds.length === 0) throw new Error(`Internal error: ResourceIds-array is empty.`)

		for (const resourceId of arg.resourceIds) {
			const resource = isProtectedString(resourceId) ? this.storage.getResource(resourceId) : resourceId
			if (!resource) throw new Error(`Resource ${resourceId} not found.`)

			const obj: TSRTimelineObj<TSRTimelineContent> = TSRTimelineObjFromResource(resource)

			let addToLayerId: string | undefined = undefined

			if (arg.layerId) {
				// Also check if there are any infinites on that layer.
				// If there is an infinite on that layer, it doesn't make sense to add another object to that layer.
				if (!isLayerInfinite(part, arg.layerId)) {
					addToLayerId = arg.layerId
				}
			}
			if (!addToLayerId) {
				if (usePreviousLayerId) {
					const mapping = project.mappings[usePreviousLayerId]
					if (allowAddingResourceToLayer(project, resource, mapping)) {
						// Also check if there are any infinites on that layer.
						// If there is an infinite on that layer, it doesn't make sense to add another object to that layer.
						if (!isLayerInfinite(part, usePreviousLayerId)) {
							addToLayerId = usePreviousLayerId
						}
					}
				}
			}

			if (!addToLayerId) {
				const result = this._findBestOrCreateLayer({
					project,
					rundown,
					part,
					obj,
					resource,
					layerMustBeFree: true,
					originalLayerId: undefined,
				})
				addToLayerId = result.layerId
				if (result.createdNewLayer) {
					addedNewLayers.push(result.layerId)
					updatedProject = true
				}
			}
			obj.layer = addToLayerId
			usePreviousLayerId = obj.layer

			const mapping = project.mappings[obj.layer] as Mapping | undefined
			const allow = mapping && allowAddingResourceToLayer(project, resource, mapping)
			if (!allow) {
				if (arg.resourceIds.length > 1) continue // ignore the error if we're adding multiple resources
				throw new Error(
					`Prevented addition of resource "${resource.id}" of type "${resource.resourceType}" to layer "${
						obj.layer
					}" ("${
						mapping ? getMappingName(mapping, obj.layer) : 'N/A'
					}") because it is of an incompatible type.`
				)
			}
			const timelineObj: TimelineObj = {
				obj,
				resolved: { instances: [] }, // set later, in postProcessPart
			}

			// Place the timelineObj at the end of the part's timeline:
			{
				const lastEnd = getLastEndTime(part.timeline, obj.layer)
				if (!Array.isArray(timelineObj.obj.enable)) {
					timelineObj.obj.enable.start = lastEnd.objId ? `#${lastEnd.objId}.end` : lastEnd.time
				}
			}

			part.timeline.push(timelineObj)
			addedNewTimelineObjIds.push(timelineObj.obj.id)
			postProcessPart(part)
		}

		this._saveUpdates({ project: updatedProject ? project : undefined, rundownId: arg.rundownId, rundown })

		return {
			undo: () => {
				let updatedProject: Project | undefined = undefined
				if (addedNewLayers.length > 0) {
					// If a new layer was added, remove it.
					updatedProject = this.getProject()
					for (const layerId of addedNewLayers) {
						delete updatedProject.mappings[layerId]
					}
				}

				const { rundown, part } = this.getPart(arg)

				part.timeline = part.timeline.filter((t) => {
					return !addedNewTimelineObjIds.includes(t.obj.id)
				})
				postProcessPart(part)
				this._saveUpdates({ project: updatedProject, rundownId: arg.rundownId, rundown })
			},
			description: ActionDescription.addResourcesToTimeline,
			ledgerKey: arg.rundownId,
		}
	}
	@Undoable
	async toggleGroupLoop(arg: {
		rundownId: string
		groupId: string
		value: boolean
	}): Promise<UndoableResult<void> | undefined> {
		const { rundown, group } = this.getGroup(arg)

		if (group.locked) {
			return
		}

		const originalValue = group.loop

		updateGroupPlayingParts(group)
		group.loop = arg.value

		this._saveUpdates({ rundownId: arg.rundownId, rundown, group })

		return {
			undo: () => {
				const { rundown, group } = this.getGroup(arg)

				updateGroupPlayingParts(group)
				group.loop = originalValue

				this._saveUpdates({ rundownId: arg.rundownId, rundown, group })
			},
			description: ActionDescription.ToggleGroupLoop,
			ledgerKey: arg.rundownId,
		}
	}
	@Undoable
	async toggleGroupAutoplay(arg: {
		rundownId: string
		groupId: string
		value: boolean
	}): Promise<UndoableResult<void> | undefined> {
		const { rundown, group } = this.getGroup(arg)

		if (group.locked) {
			return
		}

		const originalValue = group.autoPlay

		updateGroupPlayingParts(group)
		group.autoPlay = arg.value

		this._saveUpdates({ rundownId: arg.rundownId, rundown, group })

		return {
			undo: () => {
				const { rundown, group } = this.getGroup(arg)

				updateGroupPlayingParts(group)
				group.autoPlay = originalValue

				this._saveUpdates({ rundownId: arg.rundownId, rundown, group })
			},
			description: ActionDescription.ToggleGroupAutoplay,
			ledgerKey: arg.rundownId,
		}
	}
	@Undoable
	async toggleGroupOneAtATime(arg: {
		rundownId: string
		groupId: string
		value: boolean
	}): Promise<UndoableResult<void> | undefined> {
		const { rundown, group } = this.getGroup(arg)

		if (group.locked) {
			return
		}

		const originalValue = group.oneAtATime

		updateGroupPlayingParts(group)
		group.oneAtATime = arg.value
		if (group.oneAtATime) {
			const playingParts = Object.keys(group.playout.playingParts)
			if (playingParts.length > 1) {
				// Only allow one part at a time:
				const playingPart = playingParts[0] // quick and dirty, just pick one

				group.playout.playingParts = {
					[playingPart]: group.playout.playingParts[playingPart],
				}
			}
		}

		this._saveUpdates({ rundownId: arg.rundownId, rundown, group })

		return {
			undo: () => {
				const { rundown, group } = this.getGroup(arg)

				updateGroupPlayingParts(group)
				group.oneAtATime = originalValue

				this._saveUpdates({ rundownId: arg.rundownId, rundown, group })
			},
			description: ActionDescription.toggleGroupOneAtATime,
			ledgerKey: arg.rundownId,
		}
	}
	@Undoable
	async toggleGroupDisable(arg: {
		rundownId: string
		groupId: string
		value: boolean
	}): Promise<UndoableResult<void> | undefined> {
		const { rundown, group } = this.getGroup(arg)

		if (group.locked) {
			return
		}

		const originalValue = group.disabled

		updateGroupPlayingParts(group)
		group.disabled = arg.value

		this._saveUpdates({ rundownId: arg.rundownId, rundown, group })

		return {
			undo: () => {
				const { rundown, group } = this.getGroup(arg)

				updateGroupPlayingParts(group)
				group.disabled = originalValue

				this._saveUpdates({ rundownId: arg.rundownId, rundown, group })
			},
			description: ActionDescription.ToggleGroupDisable,
			ledgerKey: arg.rundownId,
		}
	}
	@Undoable
	async toggleGroupLock(arg: { rundownId: string; groupId: string; value: boolean }): Promise<UndoableResult<void>> {
		const { rundown, group } = this.getGroup(arg)
		const originalValue = group.locked

		group.locked = arg.value

		this._saveUpdates({ rundownId: arg.rundownId, rundown, group, noEffectOnPlayout: true })

		return {
			undo: () => {
				const { rundown, group } = this.getGroup(arg)

				group.locked = originalValue

				this._saveUpdates({ rundownId: arg.rundownId, rundown, group, noEffectOnPlayout: true })
			},
			description: ActionDescription.ToggleGroupLock,
			ledgerKey: arg.rundownId,
		}
	}
	@Undoable
	async toggleGroupCollapse(arg: {
		rundownId: string
		groupId: string
		value: boolean
	}): Promise<UndoableResult<void>> {
		const { rundown, group } = this.getGroup(arg)
		const originalValue = group.collapsed ?? false

		group.collapsed = arg.value

		this._saveUpdates({ rundownId: arg.rundownId, rundown, group, noEffectOnPlayout: true })

		return {
			undo: () => {
				const { rundown, group } = this.getGroup(arg)

				group.collapsed = originalValue

				this._saveUpdates({ rundownId: arg.rundownId, rundown, group, noEffectOnPlayout: true })
			},
			description: ActionDescription.ToggleGroupCollapse,
			ledgerKey: arg.rundownId,
		}
	}
	@Undoable
	async toggleAllGroupsCollapse(arg: { rundownId: string; value: boolean }): Promise<UndoableResult<void>> {
		const { rundown } = this.getRundown(arg)

		const originalValues = new Map<string, boolean>(rundown.groups.map((g) => [g.id, g.collapsed ?? false]))

		for (const group of rundown.groups) {
			group.collapsed = arg.value
		}

		this._saveUpdates({ rundownId: arg.rundownId, rundown, noEffectOnPlayout: true })

		return {
			undo: () => {
				const { rundown } = this.getRundown(arg)

				for (const group of rundown.groups) {
					const originalValue = originalValues.get(group.id)
					if (originalValue !== undefined) {
						group.collapsed = originalValue
					}
				}

				this._saveUpdates({ rundownId: arg.rundownId, rundown, noEffectOnPlayout: true })
			},
			description: ActionDescription.ToggleAllGroupsCollapse,
			ledgerKey: arg.rundownId,
		}
	}
	async refreshResources(): Promise<void> {
		this.callbacks.refreshResources()
	}
	async refreshResourcesSetAuto(arg: { interval: number }): Promise<void> {
		this.callbacks.refreshResourcesSetAuto(arg.interval)
	}
	async triggerHandleAutoFill(): Promise<void> {
		this.callbacks.triggerHandleAutoFill()
	}
	async updateAppData(arg: UpdateAppDataOptions): Promise<void> {
		const appData = this.storage.getAppData()

		if (arg.preReleaseAutoUpdate !== undefined) {
			// If preReleaseAutoUpdate is set to true when the application is a pre-release version,
			// set it to undefined, since preReleaseAutoUpdate will default to that anyway.
			// (And the reverse when app is a release version)
			// This will allow for both setting it specifically to auto-update/downgrade,
			// but also avoid an unintentional update/downgrade when installing a (pre-)release version manually.
			if (appData.version.currentVersionIsPrerelease) {
				if (arg.preReleaseAutoUpdate === true) {
					arg.preReleaseAutoUpdate = undefined
				}
			} else {
				if (arg.preReleaseAutoUpdate === false) {
					arg.preReleaseAutoUpdate = undefined
				}
			}
			appData.preReleaseAutoUpdate = arg.preReleaseAutoUpdate
		}
		if (arg.guiDecimalCount !== undefined) {
			appData.guiDecimalCount = arg.guiDecimalCount
		}

		this._saveUpdates({ appData })
	}
	async updateProject(arg: { id: string; project: Project }): Promise<Project> {
		this._saveUpdates({ project: arg.project })

		return this.storage.getProject()
	}
	@Undoable
	async newRundown(arg: { name: string }): Promise<UndoableResult<Rundown>> {
		const rundown = this.storage.newRundown(arg.name)
		const fileName = rundown.name
		this._saveUpdates({})

		return {
			undo: async () => {
				await this.storage.deleteRundown(fileName)
				this._saveUpdates({})
			},
			description: ActionDescription.NewRundown,
			result: rundown,
			ledgerKey: rundown.id,
		}
	}
	async deleteRundown(arg: { rundownId: string }): Promise<void> {
		const openRundown = this.storage.getRundown(arg.rundownId)
		if (openRundown) {
			// Stop all groups, to trigger relevant timeline-updates:
			for (const group of openRundown.groups) {
				await this.stopGroup({ rundownId: arg.rundownId, groupId: group.id })
			}
			this._saveUpdates({ rundownId: openRundown.id, rundown: openRundown })
			await this.storage.writeChangesNow()
		}

		const rundownFileName = arg.rundownId // this.storage.getRundownFilename(arg.rundownId)
		await this.storage.deleteRundown(rundownFileName)
		this._saveUpdates({})

		// Note: This is not undoable
	}
	@Undoable
	async openRundown(arg: { rundownId: string }): Promise<UndoableResult<void>> {
		this.storage.openRundown(arg.rundownId)
		this._saveUpdates({})

		return {
			undo: async () => {
				await this.storage.closeRundown(arg.rundownId)
				this._saveUpdates({})
			},
			description: ActionDescription.OpenRundown,
			ledgerKey: SpecialLedgers.APPLICATION,
		}
	}
	@Undoable
	async closeRundown(arg: { rundownId: string }): Promise<UndoableResult<void>> {
		const { rundown } = this.getRundown(arg)
		if (!rundown) {
			throw new Error(`Rundown "${arg.rundownId}" not found`)
		}

		// Stop playout
		for (const group of rundown.groups) {
			await this.stopGroup({ rundownId: arg.rundownId, groupId: group.id })
		}

		await this.storage.closeRundown(arg.rundownId)
		this._saveUpdates({})

		return {
			undo: async () => {
				this.storage.openRundown(arg.rundownId)
				this._saveUpdates({})
			},
			description: ActionDescription.CloseRundown,
			ledgerKey: SpecialLedgers.APPLICATION,
		}
	}

	@Undoable
	async renameRundown(arg: { rundownId: string; newName: string }): Promise<UndoableResult<string>> {
		const rundown = this.storage.getRundown(arg.rundownId)
		if (!rundown) {
			throw new Error(`Rundown "${arg.rundownId}" not found`)
		}

		const originalName = rundown.name
		const newRundownId = await this.storage.renameRundown(arg.rundownId, arg.newName)
		this._saveUpdates({})

		return {
			undo: async () => {
				await this.storage.renameRundown(newRundownId, originalName)
				this._saveUpdates({})
			},
			description: ActionDescription.RenameRundown,
			result: newRundownId,
			ledgerKey: arg.rundownId,
		}
	}
	async isRundownPlaying(arg: { rundownId: string }): Promise<boolean> {
		const { rundown } = this.getRundown(arg)

		for (const group of rundown.groups) {
			const playData = getGroupPlayData(group.preparedPlayData)
			if (playData.anyPartIsPlaying) {
				return true
			}
		}

		return false
	}
	async isTimelineObjPlaying(arg: { rundownId: string; timelineObjId: string }): Promise<boolean> {
		const { rundown } = this.getRundown(arg)
		const findResult = findTimelineObjInRundown(rundown, arg.timelineObjId)

		if (!findResult) {
			return false
		}

		const { group, part } = findResult

		const playData = getGroupPlayData(group.preparedPlayData)
		return Boolean(playData.playheads[part.id])
	}
	@Undoable
	async createMissingMapping(arg: { rundownId: string; mappingId: string }): Promise<UndoableResult<void>> {
		const project = this.getProject()
		const rundown = this.storage.getRundown(arg.rundownId)
		if (!rundown) {
			throw new Error(`Rundown "${arg.rundownId}" not found`)
		}

		// Find all timeline objects which reside on the missing layer.
		const createdMappings: { [mappingId: string]: Mapping } = {}

		for (const group of rundown.groups) {
			for (const part of group.parts) {
				for (const timelineObj of part.timeline) {
					if (timelineObj.obj.layer === arg.mappingId) {
						const resourceId = getResourceIdFromTimelineObj(timelineObj.obj, project.mappings)

						let deviceId: TSRDeviceId | undefined
						const resource = resourceId && this.storage.getResource(resourceId)
						if (resource) {
							deviceId = resource.deviceId
						}
						if (!deviceId) {
							// Pick the first compatible deviceId we find:
							for (const bridge of Object.values<Bridge>(project.bridges)) {
								if (deviceId) break
								for (const [findDeviceId, device] of Object.entries<DeviceOptionsAny>(
									bridge.settings.devices
								)) {
									if (device.type === timelineObj.obj.content.deviceType) {
										deviceId = protectString<TSRDeviceId>(findDeviceId)
										break
									}
								}
							}
						}

						if (!deviceId) continue

						const newMapping = getMappingFromTimelineObject(timelineObj.obj, deviceId, undefined)
						if (newMapping) {
							createdMappings[arg.mappingId] = newMapping
						}
					}
				}
			}
		}

		let newLayerId: string | undefined = undefined
		switch (Object.keys(createdMappings).length) {
			case 0:
				throw new Error('No layer could be automatically created.')
			case 1: {
				newLayerId = Object.keys(createdMappings)[0]
				const newMapping = Object.values<Mapping>(createdMappings)[0]

				if (!newMapping.layerName) {
					throw new Error('INTERNAL ERROR: Layer lacks a name.')
				}

				// Add the new layer to the project
				project.mappings = {
					...project.mappings,
					[newLayerId]: newMapping,
				}
				this._saveUpdates({ project })
				break
			}
			default:
				throw new Error(
					'No layer could be automatically created because the timeline objects on this layer are of incompatible types.'
				)
		}

		return {
			undo: async () => {
				if (newLayerId) {
					const project = this.getProject()
					delete project.mappings[newLayerId]
					this._saveUpdates({ project })
				}
			},
			description: ActionDescription.CreateMissingMapping,
			ledgerKey: arg.rundownId,
		}
	}

	@Undoable
	async addPeripheralArea(arg: { bridgeId: BridgeId; deviceId: PeripheralId }): Promise<UndoableResult<void>> {
		const bridgeIdStr = unprotectString<BridgeId>(arg.bridgeId)
		const deviceIdStr = unprotectString<PeripheralId>(arg.deviceId)
		const project = this.storage.getProject()

		const bridge = project.bridges[bridgeIdStr]
		if (!bridge) throw new Error(`Bridge "${arg.bridgeId}" not found`)

		let peripheralSettings = bridge.clientSidePeripheralSettings[deviceIdStr] as
			| BridgePeripheralSettings
			| undefined
		if (!peripheralSettings) {
			bridge.clientSidePeripheralSettings[deviceIdStr] = peripheralSettings = {
				areas: {},
			}
		}

		const newAreaId = shortID()
		const newArea: PeripheralArea = {
			name: `Area ${Object.keys(peripheralSettings.areas).length + 1}`,
			identifiers: [],
			assignedToGroupId: undefined,
			action: 'playStop',
		}
		peripheralSettings.areas[newAreaId] = newArea
		this._saveUpdates({ project })

		return {
			undo: async () => {
				if (newAreaId) {
					const project = this.storage.getProject()
					const bridge = project.bridges[bridgeIdStr]
					if (!bridge) return
					const peripheralSettings = bridge.clientSidePeripheralSettings[deviceIdStr] as
						| BridgePeripheralSettings
						| undefined
					if (!peripheralSettings) return
					delete peripheralSettings.areas[newAreaId]

					this._saveUpdates({ project })
				}
			},
			description: ActionDescription.AddPeripheralArea,
			ledgerKey: SpecialLedgers.PERIPHERALS,
		}
	}
	@Undoable
	async removePeripheralArea(data: {
		bridgeId: BridgeId
		deviceId: PeripheralId
		areaId: string
	}): Promise<UndoableResult<void>> {
		const bridgeIdStr = unprotectString<BridgeId>(data.bridgeId)
		const deviceIdStr = unprotectString<PeripheralId>(data.deviceId)
		const project = this.storage.getProject()
		const bridge = project.bridges[bridgeIdStr]
		if (!bridge) throw new Error(`Bridge "${data.bridgeId}" not found`)

		let removedArea: PeripheralArea | undefined

		const peripheralSettings = bridge.clientSidePeripheralSettings[deviceIdStr] as
			| BridgePeripheralSettings
			| undefined
		if (peripheralSettings) {
			removedArea = peripheralSettings.areas[data.areaId]
			delete peripheralSettings.areas[data.areaId]

			this._saveUpdates({ project, definingArea: null })
		}

		return {
			undo: async () => {
				if (removedArea) {
					const project = this.storage.getProject()
					const bridge = project.bridges[bridgeIdStr]
					if (!bridge) return
					const peripheralSettings = bridge.clientSidePeripheralSettings[deviceIdStr] as
						| BridgePeripheralSettings
						| undefined
					if (!peripheralSettings) return

					peripheralSettings.areas[data.areaId] = removedArea

					this._saveUpdates({ project })
				}
			},
			description: ActionDescription.RemovePeripheralArea,
			ledgerKey: SpecialLedgers.PERIPHERALS,
		}
	}
	@Undoable
	async updatePeripheralArea(arg: {
		bridgeId: BridgeId
		deviceId: PeripheralId
		areaId: string
		update: Partial<PeripheralArea>
	}): Promise<UndoableResult<void>> {
		const bridgeIdStr = unprotectString<BridgeId>(arg.bridgeId)
		const deviceIdStr = unprotectString<PeripheralId>(arg.deviceId)
		const project = this.storage.getProject()
		const bridge = project.bridges[bridgeIdStr]
		if (!bridge) throw new Error(`Bridge "${arg.bridgeId}" not found`)

		let orgArea: PeripheralArea | undefined

		const peripheralSettings = bridge.clientSidePeripheralSettings[deviceIdStr] as
			| BridgePeripheralSettings
			| undefined
		if (peripheralSettings) {
			orgArea = deepClone(peripheralSettings.areas[arg.areaId])

			peripheralSettings.areas[arg.areaId] = {
				...peripheralSettings.areas[arg.areaId],
				...arg.update,
			}

			this._saveUpdates({ project })
		}

		return {
			undo: async () => {
				if (orgArea) {
					const project = this.storage.getProject()
					const bridge = project.bridges[bridgeIdStr]
					if (!bridge) return
					const peripheralSettings = bridge.clientSidePeripheralSettings[deviceIdStr] as
						| BridgePeripheralSettings
						| undefined
					if (!peripheralSettings) return

					peripheralSettings.areas[arg.areaId] = orgArea

					this._saveUpdates({ project })
				}
			},
			description: ActionDescription.UpdatePeripheralArea,
			ledgerKey: SpecialLedgers.PERIPHERALS,
		}
	}
	@Undoable
	async assignAreaToGroup(arg: {
		groupId: string | undefined
		areaId: string
		bridgeId: BridgeId
		deviceId: PeripheralId
	}): Promise<UndoableResult<void> | undefined> {
		const bridgeIdStr = unprotectString<BridgeId>(arg.bridgeId)
		const deviceIdStr = unprotectString<PeripheralId>(arg.deviceId)
		const project = this.getProject()

		const bridge = project.bridges[bridgeIdStr]
		if (!bridge) return
		const peripheralSettings = bridge.clientSidePeripheralSettings[deviceIdStr]
		if (!peripheralSettings) return
		const area = peripheralSettings.areas[arg.areaId]
		if (!area) return

		const orgAssignedToGroupId = area.assignedToGroupId
		area.assignedToGroupId = arg.groupId
		this._saveUpdates({ project })

		return {
			undo: async () => {
				const project = this.storage.getProject()

				const bridge = project.bridges[bridgeIdStr]
				if (!bridge) return
				const peripheralSettings = bridge.clientSidePeripheralSettings[deviceIdStr]
				if (!peripheralSettings) return
				const area = peripheralSettings.areas[arg.areaId]
				if (!area) return

				area.assignedToGroupId = orgAssignedToGroupId
				this._saveUpdates({ project })
			},
			description: ActionDescription.AssignAreaToGroup,
			ledgerKey: SpecialLedgers.PERIPHERALS,
		}
	}
	async startDefiningArea(arg: { bridgeId: BridgeId; deviceId: PeripheralId; areaId: string }): Promise<void> {
		const bridgeIdStr = unprotectString<BridgeId>(arg.bridgeId)
		const deviceIdStr = unprotectString<PeripheralId>(arg.deviceId)
		const project = this.getProject()

		const bridge = project.bridges[bridgeIdStr]
		if (!bridge) return
		const peripheralSettings = bridge.clientSidePeripheralSettings[deviceIdStr]
		if (!peripheralSettings) return
		const area = peripheralSettings.areas[arg.areaId]
		if (!area) return
		area.identifiers = []

		this._saveUpdates({
			project,
			definingArea: {
				bridgeId: arg.bridgeId,
				deviceId: arg.deviceId,
				areaId: arg.areaId,
			},
		})
	}
	async finishDefiningArea(): Promise<void> {
		this._saveUpdates({ definingArea: null })
	}
	@Undoable
	async setApplicationTrigger(arg: {
		triggerAction: ApplicationTrigger['action']
		trigger: ApplicationTrigger | null
		triggerIndex: number | null
	}): Promise<UndoableResult<void> | undefined> {
		const appData = this.storage.getAppData()

		const originalTriggers = deepClone(appData.triggers)

		let triggers: ApplicationTrigger[] = appData.triggers[arg.triggerAction] ?? []

		if (arg.triggerIndex === null) {
			// Replace any existing triggers:
			triggers = arg.trigger ? [arg.trigger] : []
		} else {
			// Modify a trigger:
			if (!arg.trigger) {
				// Remove
				triggers.splice(arg.triggerIndex, 1)
			} else {
				const triggerToEdit = triggers[arg.triggerIndex]
				if (triggerToEdit) {
					triggers[arg.triggerIndex] = arg.trigger
				} else {
					triggers.push(arg.trigger)
				}
			}
		}
		// Save changes:
		appData.triggers[arg.triggerAction] = triggers

		this._saveUpdates({ appData, noEffectOnPlayout: true })
		return {
			undo: () => {
				const appData = this.storage.getAppData()
				appData.triggers = originalTriggers
				this._saveUpdates({ appData, noEffectOnPlayout: true })
			},
			description: ActionDescription.SetApplicationTrigger,
			ledgerKey: SpecialLedgers.APPLICATION,
		}
	}

	/** Save updates to various data sets.
	 * Use this last when there has been any changes to data.
	 * This will also trigger updates of the playout (timeline), perihperals etc..
	 */
	private _saveUpdates(updates: {
		appData?: AppData

		project?: Project

		rundownId?: string
		rundown?: Rundown

		group?: Group | Group[]

		definingArea?: DefiningArea | null

		noEffectOnPlayout?: boolean
	}) {
		if (updates.appData) {
			this.storage.updateAppData(updates.appData)
			this.superConductor.setAutoUpdateAllowPrerelease(false)
		}
		if (updates.project) {
			this.storage.updateProject(updates.project)
		}

		const groupsToUpdate: Group[] = []
		if (Array.isArray(updates.group)) {
			groupsToUpdate.push(...updates.group)
		} else if (updates.group) {
			groupsToUpdate.push(updates.group)
		}

		for (const group of groupsToUpdate) {
			if (group.parts.length > 1) group.transparent = false
			if (!updates.noEffectOnPlayout) {
				// Update Timeline:
				group.preparedPlayData = this.callbacks.updateTimeline(group)
				updateGroupPlayingParts(group)
			}
		}

		if (updates.rundownId && updates.rundown) {
			this.storage.updateRundown(updates.rundownId, updates.rundown)
		}

		if (updates.definingArea !== undefined) {
			this.session.updateDefiningArea(updates.definingArea)
		}

		this.callbacks.updatePeripherals()
	}
	/**
	 * Tries to find the best layer to match the provided timeline obj, or creates on if not found.
	 */
	private _findBestOrCreateLayer(arg: {
		rundown: Rundown
		part: Part
		project: Project
		obj: TSRTimelineObj<TSRTimelineContent>
		resource: ResourceAny | undefined

		layerMustBeFree: boolean
		originalLayerId: string | number | undefined
	}) {
		let addToLayerId: string | null = null
		let createdNewLayer = false

		const allDeviceIds = listAvailableDeviceIDs(arg.project.bridges)

		/** Possible layers, wich votes. The layer with the highest vote will be picked in the end */
		const possibleLayers: { [layerId: string]: number } = {}

		let useCasparCGChannel: number | undefined = undefined
		let useCasparCGLayer: number | undefined = undefined

		if (arg.resource?.resourceType === ResourceType.CASPARCG_TEMPLATE && arg.resource.gdd) {
			const gdd: GDDSchema = arg.resource.gdd
			const channel = gdd.gddPlayoutOptions?.playout?.casparcg?.channel
			if (channel !== undefined) useCasparCGChannel = channel

			const layer = gdd.gddPlayoutOptions?.playout?.casparcg?.layer
			if (layer !== undefined) useCasparCGLayer = layer
		}
		if (
			arg.resource?.resourceType === ResourceType.CASPARCG_MEDIA ||
			arg.resource?.resourceType === ResourceType.CASPARCG_TEMPLATE
		) {
			if (arg.resource.channel !== undefined) useCasparCGChannel = arg.resource.channel
			if (arg.resource.layer !== undefined) useCasparCGLayer = arg.resource.layer
		}

		// First, try to pick next free layer:
		for (const { layerId, mapping } of sortMappings(arg.project.mappings)) {
			const mappingDeviceId = protectString(mapping.deviceId)
			// Is the layer on the same device as the resource?
			if (arg.resource && arg.resource.deviceId !== mappingDeviceId) continue

			// Does the layer have a device?
			if (!allDeviceIds.has(mappingDeviceId)) continue

			// Is the layer compatible?
			if (!filterMapping(mapping, arg.obj)) continue

			if (arg.layerMustBeFree) {
				// Is the layer free?
				if (arg.part.timeline.find((checkTimelineObj) => checkTimelineObj.obj.layer === layerId)) continue
			}

			// Okay then:
			possibleLayers[layerId] = 1
		}
		// Pick the best layer, ie check which layer contains the most similar objects in other parts:
		for (const group of arg.rundown.groups) {
			for (const part of group.parts) {
				for (const timelineObj of part.timeline) {
					if (possibleLayers[timelineObj.obj.layer]) {
						// Check for similar objects on this layer:
						for (const property of Object.keys(timelineObj.obj.content)) {
							if ((timelineObj.obj.content as any)[property] === (arg.obj.content as any)[property]) {
								possibleLayers[timelineObj.obj.layer]++
							}
						}
					}
				}
			}
		}

		// For CasparCG: Don't pick layers that have the wrong channel or layer:
		if (
			(arg.resource?.resourceType === ResourceType.CASPARCG_MEDIA ||
				arg.resource?.resourceType === ResourceType.CASPARCG_TEMPLATE) &&
			(useCasparCGChannel || useCasparCGLayer)
		) {
			for (const layerId of Object.keys(possibleLayers)) {
				const mapping = arg.project.mappings[layerId]
				if (mapping?.device === DeviceType.CASPARCG) {
					const m = mapping as MappingCasparCG

					if (useCasparCGChannel && m.channel !== useCasparCGChannel) {
						possibleLayers[layerId] = -999
					}
					if (useCasparCGLayer && m.layer !== useCasparCGLayer) {
						possibleLayers[layerId] = -999
					}
				}
			}
		}

		const bestLayer = Object.entries<number>(possibleLayers).reduce(
			(prev, current) => {
				if (current[1] > prev[1]) return current
				return prev
			},
			['', 0]
		)
		if (bestLayer[1] > 0) {
			addToLayerId = bestLayer[0]
		}

		if (!addToLayerId) {
			// If no layer was found, create a new layer:
			let newMapping: Mapping | undefined = undefined
			const deviceId = arg.resource?.deviceId || guessDeviceIdFromTimelineObject(arg.project, arg.obj)
			if (deviceId) {
				newMapping = getMappingFromTimelineObject(arg.obj, deviceId, arg.resource)
			}

			if (!newMapping && arg.originalLayerId !== undefined) {
				const originalLayer = arg.project.mappings[arg.originalLayerId] as Mapping | undefined
				if (originalLayer) {
					newMapping = {
						...deepClone(originalLayer),
					}
				}
			}

			if (newMapping && newMapping.layerName) {
				// Add the new layer to the project
				const newLayerId = shortID()

				arg.project.mappings[newLayerId] = newMapping

				addToLayerId = newLayerId
				createdNewLayer = true
			}
		}

		if (!addToLayerId) throw new Error('No layer found')

		// Check that the layer exists:
		const layer = addToLayerId ? arg.project.mappings[addToLayerId] : undefined
		if (!layer) throw new Error(`Layer ${addToLayerId} not found.`)

		// Verify that the layer is OK:
		if (!filterMapping(layer, arg.obj)) throw new Error('Not a valid layer for that timeline-object.')

		return {
			/** id of the layer to use */
			layerId: addToLayerId,
			/** True if a layer was created */
			createdNewLayer,
		}
	}
}
