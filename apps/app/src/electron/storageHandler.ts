import fs from 'fs'
import path from 'path'
import EventEmitter from 'events'
import { LoggerLike } from '@shared/api'
import { omit } from '@shared/lib'
import { Project } from '../models/project/Project'
import { Rundown } from '../models/rundown/Rundown'
import { AppData } from '../models/App/AppData'
import { getDefaultAppData, getDefaultGroup, getDefaultProject, getDefaultRundown } from './defaults'
import { ResourceAny } from '@shared/models'
import { baseFolder } from '../lib/baseFolder'
import * as _ from 'lodash'
import { makeDevData } from './makeDevData'
import { getPartLabel } from '../lib/util'
import { CURRENT_VERSION } from './bridgeHandler'

const fsWriteFile = fs.promises.writeFile
const fsAppendFile = fs.promises.appendFile
const fsReadFile = fs.promises.readFile
const fsRm = fs.promises.rm
const fsAccess = fs.promises.access
const fsExists = async (filePath: string): Promise<boolean> => {
	try {
		await fsAccess(filePath)
		return true
	} catch {
		return false
	}
}
const fsRename = fs.promises.rename
const fsUnlink = fs.promises.unlink

/** This class handles all persistant data, that is stored on disk */
export class StorageHandler extends EventEmitter {
	private appData: FileAppData
	private appDataHasChanged = false
	private appDataNeedsWrite = false

	private project: FileProject
	private projectHasChanged = false
	private projectNeedsWrite = false

	private rundowns: { [fileName: string]: FileRundown }
	private rundownsHasChanged: { [fileName: string]: true } = {}
	private rundownsNeedsWrite: { [fileName: string]: true } = {}

	private resources: { [resourceId: string]: FileResource } = {}
	private resourcesHasChanged: { [resourceId: string]: true } = {}
	private resourcesNeedsWrite = false

	private emitEverything = false

	private emitTimeout: NodeJS.Timeout | null = null
	private writeTimeout: NodeJS.Timeout | null = null

	constructor(private log: LoggerLike) {
		super()
		this.appData = this.loadAppData()

		this.project = this.loadProject()
		this.rundowns = this.loadRundowns()
		this.resources = this.loadResources()

		this.cleanUpData()
	}

	init() {
		// Nothing here yet
	}
	terminate() {
		this.removeAllListeners()
	}

	/** Returns a list of available projects */
	listProjects(): { dirName: string; fileName: string }[] {
		// list all files and directories in the project folder
		const projectsDirents = fs.readdirSync(this._projectsFolder, { withFileTypes: true })

		// filter out non-directories
		const directories = projectsDirents.filter((dirent) => dirent.isDirectory())

		return directories.map((directory) => {
			return {
				dirName: directory.name,
				fileName: path.join(directory.name, 'project.json'),
			}
		})
	}

	/** Returns a list of available rundowns */
	listRundownsInProject(projectId: string): { fileName: string; version: number; name: string; open: boolean }[] {
		// list all files in the rundowns folder
		const rundownsDir = this.rundownsDir(projectId)
		let files: string[] = []
		try {
			files = fs.readdirSync(rundownsDir)
		} catch (e) {
			// ignore, it's probably because the folder doesn't exist yet
		}

		// filter out non-json files
		const jsonFiles = files.filter((file) => file.endsWith('.json') || file.endsWith('.json.tmp'))

		const jsonFilesMap = new Set<string>()
		jsonFiles.forEach((fileName) => {
			jsonFilesMap.add(fileName.replace('.json.tmp', '.json'))
		})

		// read the files to parse some data out of them for display purposes
		return Array.from(jsonFilesMap.keys()).map((fileName) => {
			const fullFilePath = path.join(rundownsDir, fileName)

			let rundown: FileRundown | undefined
			let readError: any = undefined

			try {
				const unparsed = fs.readFileSync(fullFilePath, 'utf8')
				rundown = JSON.parse(unparsed)
			} catch (e) {
				readError = e
			}
			if (!rundown) {
				const tmpFullFilePath = this.getTmpFilePath(fullFilePath)
				// Try reading the temporary file instead?
				try {
					const unparsed = fs.readFileSync(tmpFullFilePath, 'utf8')
					rundown = JSON.parse(unparsed)
				} catch (e) {
					readError = e
				}
			}

			if (!rundown) {
				throw new Error(`Unable to read file "${fullFilePath}": ${readError}`)
			} else {
				return {
					fileName,
					name: rundown.rundown.name,
					version: rundown.version,
					open: this.rundowns ? fileName in this.rundowns : false,
				}
			}
		})
	}

	getAppData(): AppData {
		return this.appData.appData
	}
	updateAppData(appData: AppData) {
		this.appData.appData = appData
		this.triggerUpdate({ appData: true })
	}

	getProject(): Project {
		return {
			id: this.appData.appData.project.id,
			...this.project.project,
		}
	}
	updateProject(project: Omit<Project, 'id'>) {
		this.project.project = project
		this.triggerUpdate({ project: true })
	}

	getRundown(fileName: string): Rundown | undefined {
		const rundown = this.rundowns[fileName]?.rundown

		if (rundown) {
			return {
				id: fileName,
				...rundown,
			}
		} else return rundown
	}
	getAllRundowns(): Rundown[] {
		return Object.entries(this.rundowns).map(([fileName, fileRundown]) => {
			return {
				id: fileName,
				...fileRundown.rundown,
			}
		})
	}
	updateRundown(fileName: string, rundown: Rundown) {
		this.rundowns[fileName].rundown = omit(rundown, 'id')
		this.rundownsHasChanged[fileName] = true
		this.triggerUpdate({ rundowns: { [fileName]: true } })
	}

	async newProject(name: string) {
		if (this.project) {
			// Write any pending changes before switching project
			// to ensure that any changes are saved
			await this.writeChangesNow()
		}
		this.appData.appData.project.id = convertToFilename(name)
		this.project = this.loadProject(name)
		this.triggerUpdate({ project: true, appData: true })
	}
	async openProject(id: string) {
		if (this.project) {
			// Write any pending changes before switching project
			// to ensure that any changes are saved
			await this.writeChangesNow()
		}
		this.appData.appData.project.id = id
		this.project = this.loadProject()
		this.triggerUpdate({ project: true, appData: true })
	}

	newRundown(name: string) {
		const fileName = this.getRundownFilename(name)
		this.rundowns[fileName] = this._loadRundown(this._projectId, fileName, name)
		this.appData.appData.rundowns[fileName] = {
			name: name,
			open: true,
		}
		this.appDataHasChanged = true
		this.appDataNeedsWrite = true
		this.triggerUpdate({ appData: true, rundowns: { [fileName]: true } })
		return fileName
	}
	openRundown(fileName: string) {
		this.rundowns[fileName] = this._loadRundown(this._projectId, fileName)
		this.rundownsHasChanged[fileName] = true
		this.appData.appData.rundowns[fileName].open = true
		this.appDataHasChanged = true
		this.appDataNeedsWrite = true
		this.triggerUpdate({ appData: true, rundowns: { [fileName]: true } })
	}
	async closeRundown(fileName: string) {
		// Write any pending changes before closing the rundown,
		// to ensure that any changes are saved, and that no further changes are written after it has closed.
		this.appData.appData.rundowns[fileName].open = false
		this.appDataHasChanged = true
		this.appDataNeedsWrite = true
		await this.writeChangesNow()
		delete this.rundowns[fileName]
		this.triggerEmitAll()
	}
	async deleteRundown(fileName: string) {
		await this.closeRundown(fileName)

		const fullPath = this.rundownPath(this._projectId, fileName)
		try {
			await fsRm(fullPath)
		} catch (error) {
			if ((error as any)?.code === 'ENOENT') {
				// The file is already gone, do nothing.
			} else {
				throw error
			}
		}
		try {
			await fsRm(this.getTmpFilePath(fullPath))
		} catch (error) {
			if ((error as any)?.code === 'ENOENT') {
				// The file is already gone, do nothing.
			} else {
				throw error
			}
		}
	}

	/**
	 * Restores a deleted rundown.
	 * Used to undo a deleteRundown operation.
	 */
	restoreRundown(rundown: Rundown) {
		const fileName = convertToFilename(rundown.id)
		this.rundowns[fileName] = {
			version: CURRENT_STORAGE_VERSION,
			id: rundown.id,
			rundown: {
				...omit(rundown, 'id'),
			},
		}
		this.rundownsHasChanged[rundown.id] = true
		this.rundownsNeedsWrite[rundown.id] = true
		this.triggerUpdate({ rundowns: { [rundown.id]: true } })
	}

	triggerEmitAll() {
		this.emitEverything = true
		this.triggerUpdate({})
	}
	triggerEmitRundown(rundownId: string) {
		this.rundownsHasChanged[rundownId] = true
		this.triggerUpdate({})
	}
	async writeChangesNow() {
		if (this.writeTimeout) {
			clearTimeout(this.writeTimeout)
			this.writeTimeout = null
		}
		await this.writeChanges()
	}

	getRundownFilename(rundownId: string): string {
		return `${convertToFilename(rundownId)}.rundown.json`
	}

	async renameRundown(rundownId: string, newName: string): Promise<string> {
		const newFileName = this.getRundownFilename(convertToFilename(newName))

		// Rename the file on disk
		const oldFilePath = this.rundownPath(this._projectId, rundownId)
		const newFilePath = this.rundownPath(this._projectId, newFileName)
		if (await fsExists(newFilePath)) {
			throw new Error(
				`Failed to rename rundown "${rundownId}" to "${newFileName}": a rundown with that filename already exists`
			)
		}
		await fsRename(oldFilePath, newFilePath)

		// Change the rundown in memory
		this.appData.appData.rundowns[newFileName] = {
			name: newName,
			open: true, // If a rundown is being renamed, then it must be open.
		}
		delete this.appData.appData.rundowns[rundownId]
		this.rundowns[newFileName] = {
			version: this.rundowns[rundownId].version,
			id: newFileName,
			rundown: {
				...this.rundowns[rundownId].rundown,
				name: newName,
			},
		}
		delete this.rundowns[rundownId]

		this.appDataNeedsWrite = true
		this.rundownsNeedsWrite[newFileName] = true
		this.triggerEmitAll()
		await this.writeChanges()

		return newFileName
	}

	getResources(): { [id: string]: ResourceAny } {
		const resources: { [id: string]: ResourceAny } = {}
		for (const [id, resource] of Object.entries(this.resources)) {
			if (resource.deleted) continue
			resources[id] = resource.resource
		}
		return resources
	}
	getResource(id: string): ResourceAny | undefined {
		const resource = this.resources[id] as FileResource | undefined
		if (resource?.deleted) return undefined
		else return resource?.resource
	}
	getResourceIds(deviceId: string): string[] {
		const ids: string[] = []
		for (const [id, resource] of Object.entries(this.resources)) {
			if (resource.deleted) continue
			if (resource.resource.deviceId === deviceId) ids.push(id)
		}
		return ids
	}
	updateResource(id: string, resource: ResourceAny | null) {
		if (resource) {
			// Set added and modified timestamps
			let existing = this.resources[id] as FileResource | undefined

			if (existing && existing.deleted && Date.now() - existing.deleted > 10 * 1000) {
				// It has been deleted for some time
				existing = undefined
			}

			let hasChanged: boolean

			if (existing) {
				resource.added = existing.resource.added

				if (_.isEqual(_.omit(existing.resource, 'added', 'modified'), _.omit(resource, 'added', 'modified'))) {
					// No change
					hasChanged = false
				} else {
					resource.modified = Date.now()
					hasChanged = true
				}
			} else {
				resource.added = Date.now()
				resource.modified = Date.now()
				hasChanged = true
			}

			if (hasChanged) {
				this.resources[id] = {
					version: CURRENT_STORAGE_VERSION,
					id,
					resource,
				}
				this.triggerUpdate({ resources: { [id]: true } })
			}
		} else {
			this.resources[id].deleted = Date.now()
			this.triggerUpdate({ resources: { [id]: true } })
		}
	}
	/**
	 * This function is intended for developers only.
	 * When called, it replaces all data with a "large" dataset, which can be used to test the GUI.
	 */
	async makeDevData() {
		for (const fileName of Object.keys(this.rundowns)) {
			await this.deleteRundown(fileName)
		}

		const devData = makeDevData()

		this.updateProject(devData.project)
		for (const rundown of devData.rundowns) {
			const filename = this.newRundown(rundown.name)
			rundown.id = filename

			this.openRundown(filename)
			this.updateRundown(filename, rundown)
		}

		for (const resource of devData.resources) {
			this.updateResource(resource.id, resource)
		}
	}

	/** Add an telemetry entry */
	async addTelemetryReport(data: any): Promise<void> {
		await fsAppendFile(this.telemetryPath, JSON.stringify(data) + '\n', 'utf-8')
	}
	/** Overwrite telemetry entries */
	async setTelemetryReport(strs: string[]): Promise<void> {
		await fsWriteFile(this.telemetryPath, strs.join('\n') + '\n', 'utf-8')
	}
	async retrieveTelemetryReports(): Promise<string[]> {
		if (!(await fsExists(this.telemetryPath))) return []
		const str = await fsReadFile(this.telemetryPath, 'utf-8')
		return str.split('\n')
	}
	async clearTelemetryReport(): Promise<void> {
		if (!(await fsExists(this.telemetryPath))) return
		await fsUnlink(this.telemetryPath)
	}

	/** Triggered when the stored data has been updated */
	private triggerUpdate(updates: {
		appData?: true
		project?: true
		rundowns?: { [rundownId: string]: true }
		closedRundowns?: true
		resources?: { [resourceId: string]: true }
	}): void {
		if (updates.appData) {
			this.appDataHasChanged = true
			this.appDataNeedsWrite = true
		}
		if (updates.project) {
			this.projectHasChanged = true
			this.projectNeedsWrite = true
		}
		if (updates.rundowns) {
			for (const rundownId of Object.keys(updates.rundowns)) {
				this.rundownsHasChanged[rundownId] = true
				this.rundownsNeedsWrite[rundownId] = true
			}
		}
		if (updates.resources) {
			for (const resourceId of Object.keys(updates.resources)) {
				this.resourcesHasChanged[resourceId] = true
				this.resourcesNeedsWrite = true
			}
		}

		if (!this.emitTimeout) {
			this.emitTimeout = setTimeout(() => {
				this.emitTimeout = null
				this.emitChanges()
			}, 5)
		}

		if (!this.writeTimeout) {
			this.writeTimeout = setTimeout(() => {
				this.writeTimeout = null
				this.writeChanges().catch(this.log.error)
			}, 500)
		}
	}

	private loadAppData(): FileAppData {
		let appData: FileAppData | undefined = undefined
		try {
			const read = fs.readFileSync(this.appDataPath, 'utf8')
			appData = JSON.parse(read)
		} catch (error) {
			if ((error as any)?.code === 'ENOENT') {
				// not found
			} else {
				throw new Error(`Unable to read AppData file "${this.appDataPath}": ${error}`)
			}
		}
		if (!appData) {
			// Second try; Check if there is a temporary file, to use instead?
			const tmpPath = this.getTmpFilePath(this.appDataPath)
			try {
				const read = fs.readFileSync(tmpPath, 'utf8')
				appData = JSON.parse(read)

				// If we only have a temporary file, we should write to the real one asap:
				this.appDataNeedsWrite = true
			} catch (error) {
				if ((error as any)?.code === 'ENOENT') {
					// not found
				} else {
					throw new Error(`Unable to read temp AppData file "${tmpPath}": ${error}`)
				}
			}
		}

		if (!appData) {
			// Default:
			this.appDataNeedsWrite = true
			appData = this.getDefaultAppData()
		} else {
			this.ensureCompatibilityAppData(appData)
		}
		// Update the currentVersion to the apps' version:
		appData.appData.version.currentVersion = CURRENT_VERSION
		if (appData.appData.version.currentVersion !== CURRENT_VERSION) {
			this.appDataNeedsWrite = true
		}
		return appData
	}
	private loadProject(newName?: string): FileProject {
		let project: FileProject | undefined = undefined
		const projectPath = this.projectPath(this._projectId)
		try {
			const read = fs.readFileSync(projectPath, 'utf8')
			project = JSON.parse(read)
			if (project) this.ensureCompatibilityProject(project?.project)
		} catch (error) {
			if ((error as any)?.code === 'ENOENT') {
				// not found
				project = undefined
			} else {
				throw new Error(`Unable to read Project file "${projectPath}": ${error}`)
			}
		}

		if (!project) {
			// Second try; Check if there is a temporary file, to use instead?
			const tmpPath = this.getTmpFilePath(projectPath)
			try {
				const read = fs.readFileSync(tmpPath, 'utf8')
				project = JSON.parse(read)
				if (project) this.ensureCompatibilityProject(project?.project)

				// If we only have a temporary file, we should write to the real one asap:
				this.projectNeedsWrite = true
			} catch (error) {
				if ((error as any)?.code === 'ENOENT') {
					// not found
				} else {
					throw new Error(`Unable to read temp Project file "${tmpPath}": ${error}`)
				}
			}
		}
		if (!project) {
			// Create a default project instead
			this.projectNeedsWrite = true
			return StorageHandler.getDefaultProject(newName)
		}

		return project
	}
	private loadRundowns(): { [fileName: string]: FileRundown } {
		const rundowns: { [fileName: string]: FileRundown } = {}

		const rundownList = this.listRundownsInProject(this._projectId)

		// Go through the appData and remove any rundowns which no longer exist on disk.
		for (const fileName in this.appData.appData.rundowns) {
			const rundownListEntry = rundownList.find((listEntry) => {
				return listEntry.fileName === fileName
			})
			if (!rundownListEntry) {
				delete this.appData.appData.rundowns[fileName]
			}
		}

		if (rundownList.length > 0) {
			// If the project has rundowns, load them.
			for (const rundown of rundownList) {
				if (rundown.fileName in this.appData.appData.rundowns) {
					// If the rundown exists in the appData and it is marked as open, load it.
					if (this.appData.appData.rundowns[rundown.fileName].open) {
						const fileRundown = this._loadRundown(this._projectId, rundown.fileName)
						rundowns[rundown.fileName] = fileRundown
					}
				} else {
					// If the rundown doesn't exist in the appData, add it as closed.
					this.appData.appData.rundowns[rundown.fileName] = {
						name: rundown.name,
						open: false,
					}
				}
			}
		} else {
			// The project has no rundowns, create a default rundown.
			const defaultRundownFilename = this.getRundownFilename('default')
			rundowns[defaultRundownFilename] = this._loadRundown(this._projectId, defaultRundownFilename)
			this.appData.appData.rundowns[defaultRundownFilename] = {
				name: 'Default Rundown',
				open: true,
			}
		}

		// Blindly handle any of the above cases where appData was modified.
		this.appDataHasChanged = true
		this.appDataNeedsWrite = true

		return rundowns
	}
	private _loadRundown(projectName: string, fileName: string, newName?: string): FileRundown {
		const rundownPath = this.rundownPath(projectName, fileName)

		let rundown: FileRundown | undefined = undefined
		try {
			const read = fs.readFileSync(rundownPath, 'utf8')
			rundown = JSON.parse(read)
		} catch (error) {
			if ((error as any)?.code === 'ENOENT') {
				// not found
				rundown = undefined
			} else {
				throw new Error(`Unable to read Rundown file "${rundownPath}": ${error}`)
			}
		}
		if (!rundown) {
			// Second try; Check if there is a temporary file, to use instead?
			const tmpPath = this.getTmpFilePath(rundownPath)
			try {
				const read = fs.readFileSync(tmpPath, 'utf8')
				rundown = JSON.parse(read)

				// If we only have a temporary file, we should write to the real one asap:
				this.rundownsNeedsWrite[fileName] = true
			} catch (error) {
				if ((error as any)?.code === 'ENOENT') {
					// not found
				} else {
					throw new Error(`Unable to read temp Rundown file "${tmpPath}": ${error}`)
				}
			}
		}
		if (!rundown) {
			// Create a default rundown then:
			this.rundownsNeedsWrite[fileName] = true
			return StorageHandler.getDefaultRundown(newName)
		}
		this.ensureCompatibilityRundown(rundown.rundown)

		return rundown
	}
	private loadResources(): { [resourceId: string]: FileResource } {
		let resources: { [resourceId: string]: FileResource } | undefined = {}
		const resourcesPath = this.resourcesPath(this._projectId)
		try {
			const read = fs.readFileSync(resourcesPath, 'utf8')
			resources = JSON.parse(read)
		} catch (error) {
			if ((error as any)?.code === 'ENOENT') {
				// not found
				resources = {}
			} else {
				throw new Error(`Unable to read Resources file "${resourcesPath}": ${error}`)
			}
		}

		if (!resources) {
			// Second try; Check if there is a temporary file, to use instead?
			const tmpPath = this.getTmpFilePath(resourcesPath)
			try {
				const read = fs.readFileSync(tmpPath, 'utf8')
				resources = JSON.parse(read)

				// If we only have a temporary file, we should write to the real one asap:
				this.resourcesNeedsWrite = true
			} catch (error) {
				if ((error as any)?.code === 'ENOENT') {
					// not found
				} else {
					throw new Error(`Unable to read temp Resources file "${tmpPath}": ${error}`)
				}
			}
		}
		if (resources) {
			// Compatibility fix:
			for (const [id, oldResource] of Object.entries<any>(resources)) {
				if (
					typeof oldResource === 'object' &&
					(oldResource.version === undefined || oldResource.resource === undefined)
				) {
					const newResource: FileResource = {
						version: CURRENT_STORAGE_VERSION,
						id: id,
						resource: oldResource,
					}
					resources[id] = newResource
				}
			}
		}

		if (!resources) {
			resources = {}
		}

		return resources
	}

	private getDefaultAppData(): FileAppData {
		return {
			version: CURRENT_STORAGE_VERSION,
			appData: {
				...getDefaultAppData(CURRENT_VERSION),
			},
		}
	}
	static getDefaultProject(newName?: string): FileProject {
		return {
			version: CURRENT_STORAGE_VERSION,
			id: 'default',
			project: getDefaultProject(newName),
		}
	}
	static getDefaultRundown(newName?: string): FileRundown {
		return {
			version: CURRENT_STORAGE_VERSION,
			id: newName ? convertToFilename(newName) : 'default',
			rundown: getDefaultRundown(newName),
		}
	}

	private emitChanges() {
		if (this.emitEverything) {
			this.appDataHasChanged = true
			this.projectHasChanged = true
			for (const fileName of Object.keys(this.rundowns)) {
				this.rundownsHasChanged[fileName] = true
			}
			for (const resourceId of Object.keys(this.resources)) {
				this.resourcesHasChanged[resourceId] = true
			}
			this.emitEverything = false
		}

		if (this.appDataHasChanged) {
			this.emit('appData', this.getAppData())
			this.appDataHasChanged = false
		}

		if (this.projectHasChanged) {
			this.emit('project', this.getProject())
			this.projectHasChanged = false
		}
		for (const fileName of Object.keys(this.rundownsHasChanged)) {
			this.emit('rundown', fileName, this.getRundown(fileName))
			delete this.rundownsHasChanged[fileName]
		}
		for (const resourceId of Object.keys(this.resourcesHasChanged)) {
			let resource = this.resources[resourceId] as FileResource | undefined
			if (resource && resource.deleted) resource = undefined
			this.emit('resource', resourceId, resource?.resource ?? null)
			delete this.resourcesHasChanged[resourceId]
		}
	}
	private async writeChanges() {
		this.cleanUpData()

		// Create dir if not exists:
		if (!fs.existsSync(this._baseFolder)) {
			fs.mkdirSync(this._baseFolder)
		}
		if (!fs.existsSync(this._projectsFolder)) {
			fs.mkdirSync(this._projectsFolder)
		}
		if (!fs.existsSync(this.projectDir(this._projectId))) {
			fs.mkdirSync(this.projectDir(this._projectId))
		}
		if (!fs.existsSync(this.rundownsDir(this._projectId))) {
			fs.mkdirSync(this.rundownsDir(this._projectId))
		}

		// Store AppData:
		if (this.appDataNeedsWrite) {
			await this.writeFileSafe(this.appDataPath, JSON.stringify(this.appData))
			this.appDataNeedsWrite = false
		}

		// Store Project:
		if (this.projectNeedsWrite) {
			await this.writeFileSafe(this.projectPath(this._projectId), JSON.stringify(this.project))
			this.projectNeedsWrite = false
		}
		// Store Rundowns:
		for (const fileName of Object.keys(this.rundownsNeedsWrite)) {
			await this.writeFileSafe(
				this.rundownPath(this._projectId, fileName),
				JSON.stringify(this.rundowns[fileName])
			)

			delete this.rundownsNeedsWrite[fileName]
		}
		// Store Resources:
		if (this.resourcesNeedsWrite) {
			await this.writeFileSafe(this.resourcesPath(this._projectId), JSON.stringify(this.resources))
			this.projectNeedsWrite = false
		}
	}
	private getTmpFilePath(filePath: string): string {
		return `${filePath}.tmp`
	}
	private async writeFileSafe(filePath: string, data: string) {
		const tmpPath = this.getTmpFilePath(filePath)
		await fsWriteFile(tmpPath, data, 'utf-8')
		try {
			await fsUnlink(filePath)
		} catch (error) {
			if ((error as any)?.code === 'ENOENT') {
				// not found, that's okay
			} else throw error
		}
		await fsRename(tmpPath, filePath)
	}

	private ensureCompatibilityAppData(appData: FileAppData) {
		const defaultAppData = getDefaultAppData(CURRENT_VERSION)

		if (!appData.appData.version) {
			// Added 2022-03-25:
			this.appDataNeedsWrite = true
			appData.appData.version = defaultAppData.version
		}
		if (!appData.appData.triggers) {
			// Added 2022-09-07:
			appData.appData.triggers = defaultAppData.triggers
		}

		let triggerType: keyof AppData['triggers']
		for (triggerType in appData.appData.triggers) {
			const triggers = appData.appData.triggers[triggerType]
			if (!triggers) continue
			for (const trigger of triggers) {
				// Added 2022-10-11
				if (!('isGlobalKeyboard' in trigger)) {
					trigger.isGlobalKeyboard = false
				}
			}
		}
	}
	private ensureCompatibilityProject(project: Omit<Project, 'id'>) {
		for (const bridge of Object.values(project.bridges)) {
			if (!bridge.peripheralSettings) bridge.peripheralSettings = {}
		}
		if (!project.deviceNames) project.deviceNames = {}
	}
	private ensureCompatibilityRundown(rundown: Omit<Rundown, 'id'>) {
		for (const group of rundown.groups) {
			if (!group.playout.playingParts) {
				group.playout = {
					playingParts: {},
				}
			}
			if (!group.autoFill) {
				group.autoFill = getDefaultGroup().autoFill
			}
			if (!group.playoutMode) {
				group.playoutMode = getDefaultGroup().playoutMode
			}
			if (!group.schedule) {
				group.schedule = getDefaultGroup().schedule
			}
			if (group.preparedPlayData) {
				if (group.preparedPlayData.type === 'single') {
					if (!group.preparedPlayData.sections) {
						group.preparedPlayData.sections = []
					}
				} else if (group.preparedPlayData.type === 'multi') {
					if (!group.preparedPlayData.sections) {
						group.preparedPlayData.sections = {}
					}
				}
			}
			for (const part of group.parts) {
				if (!part.triggers) {
					part.triggers = []
				}
				for (const trigger of part.triggers) {
					// Added 2022-10-11
					if (!('isGlobalKeyboard' in trigger)) {
						trigger.isGlobalKeyboard = false
					}
				}
				if (!part.resolved.label) part.resolved.label = getPartLabel(part)
			}
		}
	}
	private cleanUpData() {
		const GRACE_PERIOD = 1000 * 60 // 1 minute
		// Remove deleted resources:
		for (const [resourceId, resource] of Object.entries(this.resources)) {
			if (resource.deleted && Date.now() - resource.deleted > GRACE_PERIOD) {
				delete this.resources[resourceId]
			}
		}
	}

	private rundownsDir(projectId: string): string {
		return path.join(this.projectDir(projectId), 'rundowns')
	}
	private rundownPath(projectId: string, rundownFileName: string): string {
		return path.join(this.rundownsDir(projectId), rundownFileName)
	}
	private projectDir(projectId: string): string {
		return path.join(this._projectsFolder, projectId)
	}
	private projectPath(projectId: string): string {
		return path.join(this.projectDir(projectId), 'project.json')
	}
	private resourcesPath(projectId: string): string {
		return path.join(this.projectDir(projectId), 'resources.json')
	}
	private get appDataPath(): string {
		return path.join(this._baseFolder, 'appData.json')
	}
	private get telemetryPath() {
		return path.join(this._baseFolder, 'telemetry.txt')
	}
	private get _projectsFolder() {
		return path.join(this._baseFolder, 'Projects')
	}
	private get _baseFolder() {
		return baseFolder()
	}
	private get _projectId() {
		return this.appData.appData.project.id
	}
	get logPath(): string {
		return path.join(this._baseFolder, 'Logs')
	}
}

interface FileAppData {
	version: number
	appData: AppData
}
interface FileProject {
	version: number
	id: string
	project: Omit<Project, 'id'>
}
interface FileRundown {
	version: number
	id: string
	rundown: Omit<Rundown, 'id'>
}
interface FileResource {
	version: number
	id: string

	/**
	 * Is set when the resource is deleted. [timestamp]
	 * Used to keep the resource around for some time, in case there is a "blip" where a resource is temporary removed (like on startups). */
	deleted?: number
	resource: ResourceAny
}
/** Current version, used to migrate old data structures into new ones */
const CURRENT_STORAGE_VERSION = 0

function convertToFilename(str: string): string {
	return str.toLowerCase().replace(/[^a-z0-9]/g, '-')
}
