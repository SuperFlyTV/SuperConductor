import fs from 'fs'
import os from 'os'
import path from 'path'
import EventEmitter from 'events'
import { promisify } from 'util'
import short from 'short-uuid'
import { Project } from '@/models/project/Project'
import { Rundown } from '@/models/rundown/Rundown'
import { DeviceType } from 'timeline-state-resolver-types'
import { AppData, WindowPosition } from '@/models/App/AppData'
import { omit } from '@/lib/lib'

const fsWriteFile = promisify(fs.writeFile)
const fsReadDir = promisify(fs.readdir)

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

	init() {}

	/** Returns a list of available projects */
	async listProjects(): Promise<{ fileName: string }[]> {
		// list all files in the project folder
		const files = await fsReadDir(this._pojectFolder)

		// filter out non-json files
		const jsonFiles = files.filter((file) => file.endsWith('.json'))

		return jsonFiles.map((file) => {
			return {
				fileName: file,
			}
		})
	}

	/** Returns a list of available rundowns */
	async listRundowns(): Promise<{ fileName: string }[]> {
		// list all files in the rundowns folder
		const files = await fsReadDir(this._rundownsFolder)

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
		this.appDataHasChanged = true
		this.appDataNeedsWrite = true
		this.triggerUpdate()
	}

	getProject(): Project {
		return this.project.project
	}
	updateProject(project: Project) {
		this.project.project = project
		this.projectHasChanged = true
		this.projectNeedsWrite = true
		this.triggerUpdate()
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
		this.triggerUpdate()
	}

	newProject(name: string) {
		this.appData.appData.project.fileName = `${this.nameToFilename(name)}.project.json`
		this.project = this.loadProject(name)
		this.triggerUpdate()
	}
	openProject(fileName: string) {
		this.appData.appData.project.fileName = fileName
		this.project = this.loadProject()
		this.triggerUpdate()
	}

	newRundown(name: string) {
		const fileName = `${this.nameToFilename(name)}.rundown.json`
		this.rundowns[fileName] = this._loadRundown(fileName, name)
		this.triggerUpdate()
	}
	openRundown(fileName: string) {
		this.rundowns[fileName] = this._loadRundown(fileName)
		this.rundownsHasChanged[fileName] = true
		this.triggerUpdate()
	}
	closeRundown(fileName: string) {
		delete this.rundowns[fileName]
		delete this.rundownsHasChanged[fileName]
	}

	triggerEmitAll() {
		this.emitEverything = true
		this.triggerUpdate()
	}
	triggerEmitRundown(rundownId: string) {
		this.rundownsHasChanged[rundownId] = true
		this.triggerUpdate()
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
	private triggerUpdate() {
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
				return this.getDefaultAppData(defaultWindowPosition)
			} else {
				throw error
			}
		}
	}
	private loadProject(newName?: string): FileProject {
		try {
			const read = fs.readFileSync(this.projectPath(this.appData.appData.project.fileName), 'utf8')
			return JSON.parse(read) as FileProject
		} catch (error) {
			if ((error as any)?.code === 'ENOENT') {
				// not found
				return this.getDefaultProject(newName)
			} else {
				throw error
			}
		}
	}
	private loadRundowns(): { [fileName: string]: FileRundown } {
		const rundowns: { [fileName: string]: FileRundown } = {}
		for (const rundown of this.appData.appData.rundowns) {
			rundowns[rundown.fileName] = this._loadRundown(rundown.fileName)
		}
		return rundowns
	}
	private _loadRundown(fileName: string, newName?: string): FileRundown {
		try {
			const read = fs.readFileSync(this.rundownPath(fileName), 'utf8')
			return JSON.parse(read) as FileRundown
		} catch (error) {
			if ((error as any)?.code === 'ENOENT') {
				// not found
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
					fileName: 'default.project.json',
				},
				rundowns: [
					{
						fileName: 'default.rundown.json',
					},
				],
			},
		}
	}
	private getDefaultProject(newName = 'Default Project'): FileProject {
		return {
			version: 0,
			project: {
				name: newName,

				mappings: {
					'casparcg-1-10': {
						device: DeviceType.CASPARCG,
						deviceId: 'casparcg0',
						layerName: 'CasparCG 1 10',
					},
					'casparcg-1-20': {
						device: DeviceType.CASPARCG,
						deviceId: 'casparcg0',
						layerName: 'CasparCG 1 20',
					},
					'casparcg-1-30': {
						device: DeviceType.CASPARCG,
						deviceId: 'casparcg0',
						layerName: 'CasparCG 1 30',
					},
					'casparcg-2-10': {
						device: DeviceType.CASPARCG,
						deviceId: 'casparcg0',
						layerName: 'CasparCG 1 10',
					},
					'casparcg-2-20': {
						device: DeviceType.CASPARCG,
						deviceId: 'casparcg0',
						layerName: 'CasparCG 1 20',
					},
					'casparcg-2-30': {
						device: DeviceType.CASPARCG,
						deviceId: 'casparcg0',
						layerName: 'CasparCG 1 30',
					},
				},
				bridges: {},

				settings: {},
			},
		}
	}
	private getDefaultRundown(newName = 'Default Rundown'): FileRundown {
		return {
			version: 0,
			rundown: {
				name: newName,

				groups: [
					{
						id: short.generate(),
						name: 'Main',

						transparent: false,

						autoPlay: false,
						loop: false,
						parts: [
							{
								id: short.generate(),
								name: 'Part 1',
								timeline: [],

								resolved: {
									duration: 0,
								},
							},
						],
						playout: {
							startTime: null,
							partIds: [],
						},
						playheadData: null,
					},
				],
			},
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

		// Store AppData:
		if (this.appDataNeedsWrite) {
			await fsWriteFile(this.appDataPath, JSON.stringify(this.appData), 'utf-8')
			this.appDataNeedsWrite = false
		}

		// Store Project:
		if (this.projectNeedsWrite) {
			await fsWriteFile(this.projectPath(this.appData.appData.project.fileName), JSON.stringify(this.project), 'utf-8')
			this.projectNeedsWrite = false
		}
		// Store Rundowns:
		for (const fileName of Object.keys(this.rundownsNeedsWrite)) {
			await fsWriteFile(this.rundownPath(fileName), JSON.stringify(this.rundowns[fileName]), 'utf-8')

			delete this.rundownsNeedsWrite[fileName]
		}
	}

	private rundownPath(fileName: string): string {
		return path.join(this._rundownsFolder, fileName)
	}
	private projectPath(fileName: string): string {
		return path.join(this._pojectFolder, fileName)
	}
	private get appDataPath(): string {
		return path.join(this._baseFolder, 'appData.json')
	}
	private get _rundownsFolder() {
		return path.join(this._baseFolder, 'Rundowns')
	}
	private get _pojectFolder() {
		return path.join(this._baseFolder, 'Projects')
	}
	private get _baseFolder() {
		const homeDirPath = os.homedir()
		return path.join(homeDirPath, 'Documents', 'Timed-Player-Thingy')
	}
}

// export interface StoredData {
// 	project: StoredProject
// 	rundowns: StoredRundown[]
// }

// interface StoredProject {
// 	// fileName: string

// 	project: Project
// }
// interface StoredRundown {
// 	fileName: string

// 	rundown: Rundown
// }

interface FileAppData {
	version: number
	appData: AppData
}
interface FileProject {
	version: number
	project: Omit<Project, 'id'>
}
interface FileRundown {
	version: number
	rundown: Omit<Rundown, 'id'>
}
const CURRENT_VERSION = 0
