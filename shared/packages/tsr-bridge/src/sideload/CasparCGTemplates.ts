import { CasparCG } from 'casparcg-connection'
import got from 'got'
import { ResourceAny, ResourceType, CasparCGTemplate } from '@shared/models'
import { literal } from '@shared/lib'

/**
 * Populates the resource collection using the basic CasparCG TLS command
 */
export async function addTemplatesToResourcesFromCasparCG(
	resources: { [id: string]: ResourceAny },
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
			id: `${deviceId}_template_${template.name}`,
			...template,
			displayName: template.name,
		}
		resources[resource.id] = resource
	}
}

/**
 * Populates the resource collection using a call to CasparCG media-scanner, when possible.
 * @returns true if succeeded
 */
export async function addTemplatesToResourcesFromCasparCGMediaScanner(
	resources: { [id: string]: ResourceAny },
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
	resources: { [id: string]: ResourceAny },
	jsonData: MediaScannerTemplateData,
	deviceId: string
): void {
	for (const template of jsonData.templates) {
		let resource = resources[template.id] as CasparCGTemplate | undefined
		if (!resource || resource.resourceType !== ResourceType.CASPARCG_TEMPLATE) {
			resources[template.id] = resource = literal<CasparCGTemplate>({
				resourceType: ResourceType.CASPARCG_TEMPLATE,
				deviceId: deviceId,
				id: `${deviceId}_template_${template.id}`,
				name: template.id,
				size: 0,
				changed: 0,
				displayName: template.id,
			})
		}

		if (template.error) resource.errorMessage = template.error
		if (template.gdd) resource.gdd = template.gdd
	}
}
