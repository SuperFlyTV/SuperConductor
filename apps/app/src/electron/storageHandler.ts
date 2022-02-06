import fs from 'fs'
import os from 'os'
import path from 'path'
import EventEmitter from 'events'
import { promisify } from 'util'
import { Project } from '../models/project/Project'
import { Rundown } from '../models/rundown/Rundown'
import { AppData, WindowPosition } from '../models/App/AppData'
import { omit } from '@shared/lib'
import { getDefaultProject, getDefaultRundown } from './defaults'

const fsWriteFile = promisify(fs.writeFile)

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

	private emitEverything = false

	private emitTimeout: NodeJS.Timeout | null = null
	private writeTimeout: NodeJS.Timeout | null = null

	constructor(defaultWindowPosition: WindowPosition) {
		super()
		this.appData = this.loadAppData(defaultWindowPosition)

		this.project = this.loadProject()
		this.rundowns = this.loadRundowns()
	}

	init() {
		// Nothing here yet
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
	listRundownsInProject(projectId: string): { fileName: string }[] {
		// list all files in the rundowns folder
		let files: string[] = []
		try {
			files = fs.readdirSync(this.rundownsDir(projectId))
		} catch (e) {
			// ignore, it's probably because the folder doesn't exist yet
		}

		// filter out non-json files
		const jsonFiles = files.filter((file) => file.endsWith('.json'))

		return jsonFiles.map((file) => {
			return {
				fileName: file,
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
	updateProject(project: Project) {
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
		this.appData.appData.project.id = this.nameToFilename(name)
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
		const fileName = `${this.nameToFilename(name)}.rundown.json`
		this.rundowns[fileName] = this._loadRundown(this._projectId, fileName, name)
		this.triggerUpdate({ rundowns: { [fileName]: true } })
	}
	openRundown(fileName: string) {
		this.rundowns[fileName] = this._loadRundown(this._projectId, fileName)
		this.rundownsHasChanged[fileName] = true
		this.triggerUpdate({ rundowns: { [fileName]: true } })
	}
	async closeRundown(fileName: string) {
		// Write any pending changes before closing the rundown,
		// to ensure that any changes are saved, and that no further changes are written after it has closed.
		await this.writeChangesNow()

		delete this.rundowns[fileName]
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

	private nameToFilename(name: string): string {
		return name.toLowerCase().replace(/[^a-z0-9]/g, '-')
	}

	/** Triggered when the stored data has been updated */
	private triggerUpdate(updates: { appData?: true; project?: true; rundowns?: { [rundownId: string]: true } }): void {
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

		if (!this.emitTimeout) {
			this.emitTimeout = setTimeout(() => {
				this.emitTimeout = null
				this.emitChanges()
			}, 5)
		}

		if (!this.writeTimeout) {
			this.writeTimeout = setTimeout(() => {
				this.writeTimeout = null
				this.writeChanges().catch(console.error)
			}, 500)
		}
	}

	private loadAppData(defaultWindowPosition: WindowPosition): FileAppData {
		try {
			const read = fs.readFileSync(this.appDataPath, 'utf8')
			return JSON.parse(read) as FileAppData
		} catch (error) {
			if ((error as any)?.code === 'ENOENT') {
				// not found
				this.appDataNeedsWrite = true
				return this.getDefaultAppData(defaultWindowPosition)
			} else {
				throw error
			}
		}
	}
	private loadProject(newName?: string): FileProject {
		try {
			const read = fs.readFileSync(this.projectPath(this._projectId), 'utf8')
			return JSON.parse(read) as FileProject
		} catch (error) {
			if ((error as any)?.code === 'ENOENT') {
				// not found
				this.projectNeedsWrite = true
				return this.getDefaultProject(newName)
			} else {
				throw error
			}
		}
	}
	private loadRundowns(): { [fileName: string]: FileRundown } {
		const rundowns: { [fileName: string]: FileRundown } = {}

		const rundownList = this.listRundownsInProject(this._projectId)
		if (rundownList.length > 0) {
			for (const rundown of rundownList) {
				const fileRundown = this._loadRundown(this._projectId, rundown.fileName)
				this.ensureCompatibilityRundown(fileRundown.rundown)
				rundowns[rundown.fileName] = fileRundown
			}
		} else {
			// If the project has no rundowns, create a default rundown.
			const defaultRundownFilename = 'default.rundown.json'
			rundowns[defaultRundownFilename] = this._loadRundown(this._projectId, defaultRundownFilename)
		}

		return rundowns
	}
	private _loadRundown(projectName: string, fileName: string, newName?: string): FileRundown {
		try {
			const read = fs.readFileSync(this.rundownPath(projectName, fileName), 'utf8')
			return JSON.parse(read) as FileRundown
		} catch (error) {
			if ((error as any)?.code === 'ENOENT') {
				// not found
				this.rundownsNeedsWrite[fileName] = true
				return this.getDefaultRundown(newName)
			} else {
				throw error
			}
		}
	}

	private getDefaultAppData(defaultWindowPosition: WindowPosition): FileAppData {
		return {
			version: CURRENT_VERSION,
			appData: {
				windowPosition: defaultWindowPosition,
				project: {
					id: 'default',
				},
			},
		}
	}
	private getDefaultProject(newName?: string): FileProject {
		return {
			version: CURRENT_VERSION,
			id: 'default',
			project: getDefaultProject(newName),
		}
	}
	private getDefaultRundown(newName?: string): FileRundown {
		return {
			version: CURRENT_VERSION,
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
	}
	private async writeChanges() {
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
			await fsWriteFile(this.appDataPath, JSON.stringify(this.appData), 'utf-8')
			this.appDataNeedsWrite = false
		}

		// Store Project:
		if (this.projectNeedsWrite) {
			await fsWriteFile(this.projectPath(this._projectId), JSON.stringify(this.project), 'utf-8')
			this.projectNeedsWrite = false
		}
		// Store Rundowns:
		for (const fileName of Object.keys(this.rundownsNeedsWrite)) {
			await fsWriteFile(
				this.rundownPath(this._projectId, fileName),
				JSON.stringify(this.rundowns[fileName]),
				'utf-8'
			)

			delete this.rundownsNeedsWrite[fileName]
		}
	}

	private ensureCompatibilityRundown(rundown: Omit<Rundown, 'id'>) {
		for (const group of rundown.groups) {
			if (!group.playout.playingParts) {
				group.playout = {
					playingParts: {},
				}
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
	private get appDataPath(): string {
		return path.join(this._baseFolder, 'appData.json')
	}
	private get _projectsFolder() {
		return path.join(this._baseFolder, 'Projects')
	}
	private get _baseFolder() {
		const homeDirPath = os.homedir()
		return path.join(homeDirPath, 'Documents', 'SuperConductor')
	}
	private get _projectId() {
		return this.appData.appData.project.id
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
	rundown: Omit<Rundown, 'id'>
}
/** Current version, used to migrate old data structures into new ones */
const CURRENT_VERSION = 0
