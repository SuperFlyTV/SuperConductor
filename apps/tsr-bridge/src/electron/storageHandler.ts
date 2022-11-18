import fs from 'fs'
import path from 'path'
import EventEmitter from 'events'
import * as os from 'os'
import { LoggerLike } from '@shared/api'
import { AppData, WindowPosition } from '../models/AppData'
import { baseFolder } from './lib/baseFolder'
import { shortID } from './lib/lib'

const fsWriteFile = fs.promises.writeFile
const fsRename = fs.promises.rename
const fsUnlink = fs.promises.unlink

/** This class handles all persistant data, that is stored on disk */
export class StorageHandler extends EventEmitter {
	private appData: FileAppData
	private appDataHasChanged = false
	private appDataNeedsWrite = false

	private emitEverything = false

	private emitTimeout: NodeJS.Timeout | null = null
	private writeTimeout: NodeJS.Timeout | null = null

	constructor(private log: LoggerLike, defaultWindowPosition: WindowPosition) {
		super()
		this.appData = this.loadAppData(defaultWindowPosition)
	}

	init(): void {
		// Nothing here yet
	}
	terminate(): void {
		this.removeAllListeners()
	}

	getAppData(): AppData {
		return this.appData.appData
	}
	updateAppData(appData: AppData): void {
		this.appData.appData = appData

		const settings = this.appData.appData.settings

		const def = this.getDefaultAppData(appData.windowPosition)

		if (!settings.superConductorHost) settings.superConductorHost = def.appData.settings.superConductorHost
		if (!settings.bridgeId) settings.bridgeId = def.appData.settings.bridgeId
		if (!settings.listenPort) settings.listenPort = def.appData.settings.listenPort

		// Ensure host is prepended with ws://
		if (!`${settings.superConductorHost}`.match(/^ws(s)?:\/\//)) {
			// ws:// or wss://
			settings.superConductorHost = 'ws://' + settings.superConductorHost
		}

		this.triggerUpdate({ appData: true })
	}

	triggerEmitAll(): void {
		this.emitEverything = true
		this.triggerUpdate({})
	}
	async writeChangesNow(): Promise<void> {
		if (this.writeTimeout) {
			clearTimeout(this.writeTimeout)
			this.writeTimeout = null
		}
		await this.writeChanges()
	}

	private convertToFilename(str: string): string {
		return str.toLowerCase().replace(/[^a-z0-9]/g, '-')
	}

	/** Triggered when the stored data has been updated */
	private triggerUpdate(updates: { appData?: true }): void {
		if (updates.appData) {
			this.appDataHasChanged = true
			this.appDataNeedsWrite = true
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

	private loadAppData(defaultWindowPosition: WindowPosition): FileAppData {
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

		const defaultAppData = this.getDefaultAppData(defaultWindowPosition)
		if (!appData) {
			// Default:
			this.appDataNeedsWrite = true
			appData = defaultAppData
		}

		return appData
	}

	private getDefaultAppData(defaultWindowPosition: WindowPosition): FileAppData {
		return {
			version: CURRENT_VERSION,
			appData: {
				windowPosition: defaultWindowPosition,
				settings: {
					guiSettingsOpen: true,

					listenPort: 5401,
					acceptConnections: true,

					superConductorHost: 'ws://127.0.0.1:5400',
					bridgeId: `${os.hostname()}_${shortID()}`,
				},
			},
		}
	}

	private emitChanges() {
		if (this.emitEverything) {
			this.appDataHasChanged = true
			this.emitEverything = false
		}

		if (this.appDataHasChanged) {
			this.emit('appData', this.getAppData())
			this.appDataHasChanged = false
		}
	}
	private async writeChanges() {
		// Create dir if not exists:
		if (!fs.existsSync(this._baseFolder)) {
			fs.mkdirSync(this._baseFolder)
		}

		// Store AppData:
		if (this.appDataNeedsWrite) {
			await this.writeFileSafe(this.appDataPath, JSON.stringify(this.appData))
			this.appDataNeedsWrite = false
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

	private get appDataPath(): string {
		return path.join(this._baseFolder, 'appData.json')
	}
	private get _baseFolder() {
		return baseFolder()
	}
	get logPath(): string {
		return path.join(this._baseFolder, 'Logs')
	}
}

interface FileAppData {
	version: number
	appData: AppData
}

/** Current version, used to migrate old data structures into new ones */
const CURRENT_VERSION = 0
