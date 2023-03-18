import * as fs from 'fs'
import * as path from 'path'
import * as util from 'util'
import { exec } from 'child_process'
import recursiveReadDir from 'recursive-readdir'
import * as cheerio from 'cheerio'

import { CasparCG, Config } from 'casparcg-connection'
import got from 'got'
import { ResourceAny, ResourceType, CasparCGTemplate, ResourceId } from '@shared/models'
import { generateResourceId, literal } from '@shared/lib'

// eslint-disable-next-line @typescript-eslint/no-misused-promises
const recursiveReadDirAsync = util.promisify(recursiveReadDir)

/**
 * Populates the resource collection using the basic CasparCG TLS command
 */
export async function addTemplatesToResourcesFromCasparCG(
	resources: Map<ResourceId, ResourceAny>,
	casparCG: CasparCG,
	deviceId: string
): Promise<void> {
	const res = await casparCG.tls()
	const templatesList = res.response.data as {
		type: 'template'
		name: string
		size: number
		changed: number
	}[]
	for (const template of templatesList) {
		const resource: CasparCGTemplate = {
			resourceType: ResourceType.CASPARCG_TEMPLATE,
			deviceId: deviceId,
			id: generateResourceId(deviceId, ResourceType.CASPARCG_TEMPLATE, template.name),
			...template,
			displayName: template.name,
		}
		resources.set(resource.id, resource)
	}
}

/**
 * Populates the resource collection using a call to CasparCG media-scanner, when possible.
 * @returns true if succeeded
 */
export async function addTemplatesToResourcesFromCasparCGMediaScanner(
	resources: Map<ResourceId, ResourceAny>,
	casparCG: CasparCG,
	deviceId: string
): Promise<boolean> {
	let jsonData: MediaScannerTemplateData | null = null

	try {
		jsonData = await got.get(`http://${casparCG.host}:8000/templates`).json()
	} catch {
		// ignore
	}
	if (jsonData && Array.isArray(jsonData.templates)) {
		populateResources(resources, jsonData, deviceId)
		return true
	}
	return false
}
/**
 * Populates the resource collection by reading the template files from disk directly.
 * @returns true if succeeded
 */
export async function addTemplatesToResourcesFromDisk(
	resources: Map<ResourceId, ResourceAny>,
	casparCG: CasparCG,
	deviceId: string
): Promise<boolean> {
	// If CasparCG is running locally, we could try reading the template files manually.
	if (casparCG.host === '127.0.0.1' || casparCG.host === 'localhost') {
		const config = await casparCG.infoConfig()
		const configData: Config.Intermediate.CasparCGConfig = config.response.data
		if (configData) {
			const templatePath = configData.paths.templatePath

			let absoluteTemplatePath = ''

			// If the path is absolute, we can use that directly:
			if (await checkIfPathExists(path.resolve(templatePath))) {
				absoluteTemplatePath = path.resolve(templatePath)
			}

			if (!absoluteTemplatePath) {
				// Figure out the path to caspar and use that:
				const casparPath = await getCasparCGProcessPath()
				if (casparPath) {
					const casparDirPath = path.dirname(casparPath)
					if (await checkIfPathExists(path.join(casparDirPath, templatePath))) {
						absoluteTemplatePath = path.join(casparDirPath, templatePath)
					}
				}
			}

			if (absoluteTemplatePath) {
				// (The following is basically a copy of how media-scanner does it)

				// Find all template files in the folder:
				const files = (await recursiveReadDirAsync(absoluteTemplatePath)) as string[]

				// Categorize HTML templates separately,
				// because they have features that other template types do not.
				const htmlTemplates = []
				const otherTemplates = []
				for (const filePath of files) {
					{
						// Find HTML-based templates:
						const m = filePath.match(/\.(html|htm)$/)
						if (m) {
							htmlTemplates.push({ filePath, type: 'html' })
							continue
						}
					}
					{
						// Find other (eg flash) templates:
						const m = filePath.match(/\.(ft|wt|ct|swf)$/)
						if (m) {
							otherTemplates.push({ filePath, type: m[1] })
							continue
						}
					}
				}

				// Extract any Graphics Data Defintions (GDD) from HTML templates.
				const htmlTemplatesInfo: MediaScannerTemplateDataTemplate[] = await Promise.all(
					htmlTemplates.map(async ({ filePath, type }) => {
						const info: MediaScannerTemplateDataTemplate = {
							id: getId(absoluteTemplatePath, filePath),
							path: filePath,
							type,
						}
						try {
							const gddScriptElement = await getGDDScriptElement(filePath)
							if (gddScriptElement) {
								info.gdd = await extractGDDJSON(filePath, gddScriptElement)
							}
						} catch (error) {
							info.error = error + ''
						}
						return info
					})
				)

				// Gather the info for all templates:
				const otherTemplatesInfo: MediaScannerTemplateDataTemplate[] = otherTemplates.map(
					({ filePath, type }) => {
						return {
							id: getId(absoluteTemplatePath, filePath),
							path: filePath,
							type,
						}
					}
				)

				const allTemplates: MediaScannerTemplateDataTemplate[] = htmlTemplatesInfo
					.concat(otherTemplatesInfo)
					.sort((a, b) => {
						// Sort alphabetically
						if (a.id < b.id) {
							return -1
						} else if (a.id > b.id) {
							return 1
						} else {
							return 0
						}
					})

				populateResources(
					resources,
					{
						templates: allTemplates,
					},
					deviceId
				)
				return true
			}
		}
	}
	return false
}

interface MediaScannerTemplateData {
	templates: MediaScannerTemplateDataTemplate[]
}
interface MediaScannerTemplateDataTemplate {
	id: string
	path: string
	type: string
	error?: string
	gdd?: any
}
function populateResources(
	resources: Map<ResourceId, ResourceAny>,
	jsonData: MediaScannerTemplateData,
	deviceId: string
): void {
	for (const template of jsonData.templates) {
		const resourceId = generateResourceId(deviceId, ResourceType.CASPARCG_TEMPLATE, template.id)
		let resource = resources.get(resourceId) as CasparCGTemplate | undefined
		if (!resource || resource.resourceType !== ResourceType.CASPARCG_TEMPLATE) {
			resource = literal<CasparCGTemplate>({
				resourceType: ResourceType.CASPARCG_TEMPLATE,
				deviceId: deviceId,
				id: resourceId,
				name: template.id,
				size: 0,
				changed: 0,
				displayName: template.id,
			})
			resources.set(resourceId, resource)
		}

		if (template.error) resource.errorMessage = template.error
		if (template.gdd) resource.gdd = template.gdd
	}
}

/** Checks if a path exists. returns the path if so */
async function checkIfPathExists(path: string): Promise<boolean> {
	try {
		await fs.promises.access(path, fs.constants.R_OK)
		return true
	} catch (e) {
		return false
	}
}

/** Returns the executable path of a currently running casparcg process */
async function getCasparCGProcessPath(): Promise<string | undefined> {
	if (process.platform === 'win32') {
		// On Windows
		const result = await execPromise(`wmic process where "name='casparcg.exe'" get ExecutablePath`)
		const lines = result.stdout.split(/\r?\n/)
		if (lines.length >= 2) {
			return lines[1]
		}
	}
	if (process.platform === 'linux') {
		// On linux
		// Note: This is implemented blindly, it hasn't been tested..
		const casparPID = (await execPromise('pidof casparcg')).stdout
		if (casparPID && casparPID.match(/^\d+$/)) {
			// is a number
			return (await execPromise(`readlink -f /proc/${casparPID}/exe`)).stdout
		}
	}
}
async function execPromise(command: string): Promise<{ stdout: string; stderr: string }> {
	return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
		exec(command, (error, stdout, stderr) => {
			if (error) {
				reject(error)
			} else {
				resolve({ stdout, stderr })
			}
		})
	})
}

function getId(fileDir: string, filePath: string): string {
	return path
		.relative(fileDir, filePath) /* take file name without path */
		.replace(/\.[^/.]+$/, '') /* remove last extension */
		.replace(/\\+/g, '/') /* replace (multiple)backslashes with forward slashes */
		.toUpperCase()
}

async function getGDDScriptElement(filePath: string): Promise<cheerio.Cheerio<cheerio.Element> | undefined> {
	const html = await fs.promises.readFile(filePath)
	const $ = cheerio.load(html)
	const gddScripts = $('script[name="graphics-data-definition"]')
	if (gddScripts.length === 0) {
		return undefined
	} else {
		return gddScripts.first()
	}
}

async function extractGDDJSON(filePath: string, scriptElem: cheerio.Cheerio<cheerio.Element>) {
	const src = scriptElem.attr('src')
	let gddContent
	if (src) {
		const externalGDDPath = path.resolve(path.dirname(filePath), src)
		try {
			gddContent = await fs.promises.readFile(externalGDDPath, { encoding: 'utf-8' })
		} catch (error) {
			throw new Error(`Failed to read external GDD "${src}" from "${filePath}", does the file exist?`)
		}
	} else {
		gddContent = scriptElem.text()
	}

	try {
		return JSON.parse(gddContent)
	} catch (error) {
		throw new Error(`Failed to parse GDD from "${filePath}", is it valid JSON?`)
	}
}
