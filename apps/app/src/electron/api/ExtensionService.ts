import { Application, Params } from '@feathersjs/feathers'
import { NotFound } from '@feathersjs/errors'
import EventEmitter from 'node:events'
import fs from 'node:fs/promises'
import path from 'node:path'
import { ServiceTypes } from '../../ipc/IPCAPI'
import { StorageHandler } from '../storageHandler'
import { ExtensionData, ExtensionManifest, ExtensionName } from 'src/models/GUI/Extension'
import { IDisposable } from 'src/lib/util'
import { LoggerLike } from '@shared/api'
import { pathToFileURL } from 'node:url'

export const EXTENSIONS_CHANNEL_PREFIX = 'projects'
export class ExtensionsService extends EventEmitter {
	private extensionWatcher: IDisposable | undefined
	extensions: Map<ExtensionName, ExtensionData> = new Map()

	constructor(
		private app: Application<ServiceTypes, any>,
		private storageHandler: StorageHandler,
		private appVersion: string,
		public log: LoggerLike
	) {
		super()
		this.extensionWatcher = this.storageHandler.createExtensionWatcher(this.onExtensionChanged)
	}

	get = async (name: ExtensionName): Promise<ExtensionData> => {
		const extension = this.extensions.get(name)
		if (!extension) {
			throw new NotFound()
		}

		return extension
	}

	getAll = async (params: Params): Promise<ExtensionData[]> => {
		if (params.connection) {
			// TODO: this will include organizationId in the future
			this.app.channel(EXTENSIONS_CHANNEL_PREFIX).join(params.connection) // automatically subscribes to updates
		}
		return Array.from(this.extensions.values())
	}

	find = async (): Promise<ExtensionData[]> => {
		return Array.from(this.extensions.values())
	}

	private onExtensionChanged = (type: 'added' | 'removed', filePath: string): void => {
		if (type === 'added') {
			this.runTask(async () => this.registerExtension(filePath))
		} else {
			this.runTask(async () => this.unregisterExtension(filePath))
		}
	}

	private runTask = (fnc: () => Promise<void>) => {
		fnc().catch((err) => {
			this.log.error(err)
		})
	}

	private registerExtension = async (filePath: string): Promise<void> => {
		const manifestStr = await fs.readFile(path.join(filePath, 'package.json'), {
			encoding: 'utf-8',
		})
		this.log.debug(manifestStr)
		const manifest = JSON.parse(manifestStr) as ExtensionManifest
		if (typeof manifest !== 'object' || typeof manifest.name !== 'string')
			throw new Error(`Extension has invalid package.json: "${filePath}"`)
		if (!this.isPackageCompatible(manifest))
			throw new Error(
				`Incompatible package engine version: "${manifest.engines.superconductor}", "${this.appVersion}"`
			)

		const entryPointFileName = manifest.main ?? 'index.js'
		const entryPointFilePath = path.join(filePath, entryPointFileName)
		await fs.access(entryPointFilePath)

		const url = pathToFileURL(entryPointFilePath).toString()
		this.extensions.set(manifest.name, {
			name: manifest.name,
			manifest,
			filePath,
			url,
		})
		this.emit('added', manifest.name, manifest, url)
	}

	private unregisterExtension = async (filePath: string): Promise<void> => {
		const data = Array.from(this.extensions.entries()).find(([_name, data]) => data.filePath === filePath)
		if (!data) return
		const name = data[0]
		this.extensions.delete(name)
		this.emit('removed', name)
	}

	private isPackageCompatible = (manifest: ExtensionManifest): boolean => {
		if (manifest.engines.superconductor !== this.appVersion) return false
		return true
	}

	unsubscribe = async (params: Params): Promise<void> => {
		if (params.connection) {
			// TODO: this will include organizationId in the future
			this.app.channel(EXTENSIONS_CHANNEL_PREFIX).leave(params.connection)
		}
	}

	terminate = async (): Promise<void> => {
		this.extensionWatcher?.dispose()
	}
}
