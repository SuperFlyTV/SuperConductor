import { LoggerLike } from '@shared/api'
import fs from 'fs/promises'
import path from 'path'
import { pathToFileURL } from 'url'
import { StorageHandler } from './storageHandler'
import { IDisposable } from '../lib/util'
import { ExtensionManifest, ExtensionName } from 'src/models/GUI/Extension'

export class ExtensionHandler {
	private extensionWatcher: IDisposable | undefined
	private extensionPathsToManifests: Map<string, ExtensionManifest> = new Map()
	extensionNamesToManifests: Map<ExtensionName, ExtensionManifest> = new Map()

	constructor(
		private log: LoggerLike,
		private storageHandler: StorageHandler,
		private appVersion: string,
		private callbacks: {
			onExtensionAdded: (extensionManifest: ExtensionManifest, baseUrl: string) => void
			onExtensionRemoved: (extensionName: ExtensionName) => void
		}
	) {}

	init = (): void => {
		this.extensionWatcher = this.storageHandler.createExtensionWatcher(this.onExtensionChanged)
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
		const manifest = JSON.parse(manifestStr)
		if (typeof manifest !== 'object' || typeof manifest.name !== 'string')
			throw new Error(`Extension has invalid package.json: "${filePath}"`)
		if (!this.isPackageCompatible(manifest))
			throw new Error(
				`Incompatible package engine version: "${manifest.engines.superconductor}", "${this.appVersion}"`
			)
		this.extensionPathsToManifests.set(filePath, manifest)
		this.callbacks.onExtensionAdded(manifest, pathToFileURL(filePath).toString())
	}

	private unregisterExtension = async (filePath: string): Promise<void> => {
		const manifest = this.extensionPathsToManifests.get(filePath)
		if (!manifest) return
		this.extensionPathsToManifests.delete(filePath)
		this.extensionNamesToManifests.delete(manifest.name)
		this.callbacks.onExtensionRemoved(manifest.name)
	}

	private isPackageCompatible = (manifest: ExtensionManifest): boolean => {
		if (manifest.engines.superconductor !== this.appVersion) return false
		return true
	}

	terminate = (): void => {
		this.extensionWatcher?.dispose()
	}
}
