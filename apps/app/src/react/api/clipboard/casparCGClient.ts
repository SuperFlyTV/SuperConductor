import { getResourceIdFromResource, assertNever, literal } from '@shared/lib'
import { protectString } from '@shared/models'
import { CasparCGMedia, CasparCGTemplate, ResourceAny, ResourceType } from '@shared/models'
import { DeviceType } from 'timeline-state-resolver-types'
import { getDefaultGroup, getDefaultPart } from '../../../lib/defaults.js'
import { findDeviceOfType, shortID } from '../../../lib/util.js'
import { Group } from '../../../models/rundown/Group.js'
import { Part } from '../../../models/rundown/Part.js'
import { store } from '../../mobx/store.js'
import { ClipBoardContext, insertGroups, insertParts } from './lib.js'

const parser = new DOMParser()

/**
 * Handle pasted data from the CasparCG Client
 * Returns true if able to handle the incoming data
 */
export async function handleCasparCGClient(context: ClipBoardContext, str: string): Promise<boolean> {
	if (!str.startsWith('<?xml version="1.0"?><items><item><type>')) return false

	let xml: Document
	try {
		xml = parser.parseFromString(str, 'text/xml')
	} catch (err) {
		context.handleError('Error parsing CasparCG Client XML: ' + err)
		return false
	}

	const groups: {
		group: Group
		resources: {
			[partId: string]: ResourceAny[]
		}
	}[] = []
	const parts: { part: Part; resources: ResourceAny[] }[] = []

	for (const itemXML of xml.querySelectorAll(':root>item')) {
		const item = parseItem(itemXML)

		// Is Group?
		if (item.type === 'GROUP') {
			const group = parseGroup(context, item)
			if (group) {
				groups.push(group)
			}
		} else {
			const part = parsePart(context, item)
			if (part) {
				parts.push(part)
			}
		}
	}

	if (groups.length) {
		await insertGroups(context, groups)
	}
	if (parts.length) {
		await insertParts(context, parts)
	}
	return true
}

function parseItem(xml: Element): ItemAny {
	const o: ItemAny = {} as any

	for (const child of xml.children) {
		const key = child.tagName
		if (key === 'items') {
			const items = []
			for (const child2 of child.querySelectorAll('item')) {
				items.push(parseItem(child2))
			}
			;(o as any)['items'] = items
		} else if (key === 'templatedata') {
			const data: any = {}
			for (const componentdata of child.querySelectorAll('componentdata')) {
				const id = componentdata.querySelector('id')
				const value = componentdata.querySelector('value')
				if (id?.textContent && value?.textContent) {
					data[id.textContent] = value.textContent
				}
			}
			;(o as any)[key] = data
		} else {
			;(o as any)[key] = child.innerHTML
		}
	}

	return o
}

type ItemAny = ItemAudio | ItemStill | ItemImagescroller | ItemTemplate | ItemMovie | ItemGroup

interface ItemAudio {
	type: 'AUDIO'
	devicename: string //
	label: string // Audio
	name: string // Audio
	channel: string // 1
	videolayer: string // 30
	delay: string // 0
	duration: string // 0
	allowgpi: string // false
	allowremotetriggering: string // false
	remotetriggerid: string //
	storyid: string //
	transition: string // CUT
	transitionDuration: string // 1
	tween: string // Linear
	direction: string // RIGHT
	loop: string // false
	useauto: string // false
	triggeronnext: string // false
	color: string // Transparent
}
interface ItemStill {
	type: 'STILL'
	devicename: string //
	label: string // Image
	name: string // Image
	channel: string // 1
	videolayer: string // 10
	delay: string // 0
	duration: string // 0
	allowgpi: string // false
	allowremotetriggering: string // false
	remotetriggerid: string //
	storyid: string //
	transition: string // CUT
	transitionDuration: string // 1
	tween: string // Linear
	direction: string // RIGHT
	useauto: string // false
	triggeronnext: string // false
	color: string // Transparent
}
interface ItemImagescroller {
	type: 'IMAGESCROLLER'
	devicename: string //
	label: string // Image Scroller
	name: string // Image Scroller
	channel: string // 1
	videolayer: string // 10
	delay: string // 0
	duration: string // 0
	allowgpi: string // false
	allowremotetriggering: string // false
	remotetriggerid: string //
	storyid: string //
	blur: string // 0
	speed: string // 8
	premultiply: string // false
	progressive: string // false
	color: string // Transparent
}
interface ItemTemplate {
	type: 'TEMPLATE'
	devicename: string //
	label: string // Template
	name: string // Template
	channel: string // 1
	videolayer: string // 20
	delay: string // 0
	duration: string // 0
	allowgpi: string // false
	allowremotetriggering: string // false
	remotetriggerid: string //
	storyid: string //
	flashlayer: string // 1
	invoke: string //
	usestoreddata: string // false
	useuppercasedata: string // false
	triggeronnext: string // false
	sendasjson: string // false
	color: string // Transparent
	templatedata: {
		[key: string]: string
	}
}
interface ItemMovie {
	type: 'MOVIE'
	devicename: string //
	label: string // Video
	name: string // Video
	channel: string // 1
	videolayer: string // 10
	delay: string // 0
	duration: string // 0
	allowgpi: string // false
	allowremotetriggering: string // false
	remotetriggerid: string //
	storyid: string //
	transition: string // CUT
	transitionDuration: string // 1
	tween: string // Linear
	direction: string // RIGHT
	seek: string // 0
	length: string // 0
	loop: string // false
	freezeonload: string // false
	triggeronnext: string // false
	autoplay: string // false
	color: string // Transparent
	timecode: string //
}
interface ItemGroup {
	type: 'GROUP'
	label: string // Group
	expanded: string // true
	channel: string // 1
	videolayer: string // 10
	delay: string // 0
	duration: string // 0
	allowgpi: string // false
	allowremotetriggering: string // false
	remotetriggerid: string //

	storyid: string //

	notes: string //

	autostep: string // false
	autoplay: string // false
	color: string // Transparent
	items: ItemAny[]
}
function parseGroup(
	context: ClipBoardContext,
	item: ItemGroup
): { group: Group; resources: { [partId: string]: ResourceAny[] } } {
	const resources: { [partId: string]: ResourceAny[] } = {}
	const group: Group = {
		...getDefaultGroup(),
		id: shortID(),
		name: item.label || 'Group',

		// item.notes
		oneAtATime: true,
	}
	if (item.autoplay === 'true') {
		group.autoPlay = true
	}

	for (const item2 of item.items) {
		const part = parsePart(context, item2)
		if (part) {
			group.parts.push(part.part)
			if (!resources[part.part.id]) resources[part.part.id] = []
			resources[part.part.id].push(...part.resources)
		}
	}

	return { group, resources }
}
function parsePart(context: ClipBoardContext, item: ItemAny): { part: Part; resources: ResourceAny[] } | null {
	if (!context.project) return null

	switch (item.type) {
		case 'AUDIO':
		case 'STILL':
		case 'MOVIE': {
			const part: Part = {
				...getDefaultPart(),
				id: shortID(),
				name: item.label,
			}
			if (item.type !== 'STILL' && item.loop === 'true') part.loop = true

			let useResource: ResourceAny | undefined = undefined
			// Try to find resource in library:
			for (const resource of store.resourcesAndMetadataStore.resources.values()) {
				if (resource.resourceType === ResourceType.CASPARCG_MEDIA) {
					if (resource.name === item.name) {
						useResource = resource
						break
					}
				}
			}
			if (!useResource) {
				// Fall back to using what we have:
				const deviceId = findDeviceOfType(context.project.bridges, DeviceType.CASPARCG)
				if (deviceId) {
					let type: CasparCGMedia['type']
					if (item.type === 'STILL') {
						type = 'image'
					} else if (item.type === 'MOVIE') {
						type = 'video'
					} else if (item.type === 'AUDIO') {
						type = 'audio'
					} else {
						assertNever(item)
						type = 'video'
					}

					useResource = literal<CasparCGMedia>({
						deviceId: deviceId,
						id: protectString(''), // set by getResourceIdFromResource() later
						displayName: item.name,
						resourceType: ResourceType.CASPARCG_MEDIA,
						type: type,
						name: item.name,
						size: 0,
						changed: Date.now(),
						frames: 0,
						frameTime: '',
						frameRate: 0,
						duration: parseInt(item.duration, 10) || 0,
						channel: parseInt(item.channel, 10) || undefined,
						layer: parseInt(item.videolayer, 10) || undefined,
					})
					useResource.id = getResourceIdFromResource(useResource)
				}
			}
			if (useResource && useResource.resourceType === ResourceType.CASPARCG_MEDIA) {
				useResource.duration = parseInt(item.duration, 10) || 0
				useResource.channel = parseInt(item.channel, 10) || undefined
				useResource.layer = parseInt(item.videolayer, 10) || undefined
			}

			return { part, resources: useResource ? [useResource] : [] }
		}
		case 'TEMPLATE': {
			const part: Part = {
				...getDefaultPart(),
				id: shortID(),
				name: item.label,
			}

			let useResource: ResourceAny | undefined = undefined
			// Try to find resource in library:
			for (const resource of store.resourcesAndMetadataStore.resources.values()) {
				if (resource.resourceType === ResourceType.CASPARCG_MEDIA) {
					if (resource.name === item.name) {
						useResource = resource
						break
					}
				}
			}
			if (!useResource) {
				// Fall back to using what we have:
				const deviceId = findDeviceOfType(context.project.bridges, DeviceType.CASPARCG)
				if (deviceId) {
					useResource = literal<CasparCGTemplate>({
						deviceId: deviceId,
						id: protectString(''), // set by getResourceIdFromResource() later
						displayName: item.name,
						resourceType: ResourceType.CASPARCG_TEMPLATE,
						name: item.name,
						size: 0,
						changed: Date.now(),
					})
					useResource.id = getResourceIdFromResource(useResource)
				}
			}
			if (
				useResource &&
				(useResource.resourceType === ResourceType.CASPARCG_TEMPLATE ||
					useResource?.resourceType === ResourceType.CASPARCG_MEDIA)
			) {
				if (useResource.resourceType === ResourceType.CASPARCG_TEMPLATE) {
					useResource.data = item.templatedata
					useResource.sendDataAsXML = item.sendasjson !== 'true'
				}
				useResource.duration = parseInt(item.duration, 10) || 0
				useResource.channel = parseInt(item.channel, 10) || undefined
				useResource.layer = parseInt(item.videolayer, 10) || undefined
			}
			return { part, resources: useResource ? [useResource] : [] }
		}
		case 'IMAGESCROLLER':
			return null // not supported by TSR
		case 'GROUP':
			return null // not handled here
		default:
			assertNever(item)
			return null
	}
}

/* AMB
<?xml version="1.0"?>
<items>
    <item>
        <type>MOVIE</type>
        <devicename>Local</devicename>
        <label>Video</label>
        <name>AMB</name>
        <channel>1</channel>
        <videolayer>10</videolayer>
        <delay>0</delay>
        <duration>0</duration>
        <allowgpi>false</allowgpi>
        <allowremotetriggering>false</allowremotetriggering>
        <remotetriggerid>
        </remotetriggerid>
        <storyid>
        </storyid>
        <transition>CUT</transition>
        <transitionDuration>1</transitionDuration>
        <tween>Linear</tween>
        <direction>RIGHT</direction>
        <seek>0</seek>
        <length>0</length>
        <loop>false</loop>
        <freezeonload>false</freezeonload>
        <triggeronnext>false</triggeronnext>
        <autoplay>false</autoplay>
        <color>Transparent</color>
        <timecode>
        </timecode>
    </item>
</items>
*/

/*
Group with 2 items:

<?xml version="1.0"?>
<items>
    <item>
        <type>GROUP</type>
        <label>Group</label>
        <expanded>true</expanded>
        <channel>1</channel>
        <videolayer>10</videolayer>
        <delay>0</delay>
        <duration>0</duration>
        <allowgpi>false</allowgpi>
        <allowremotetriggering>false</allowremotetriggering>
        <remotetriggerid>
        </remotetriggerid>
        <storyid>
        </storyid>
        <notes>
        </notes>
        <autostep>false</autostep>
        <autoplay>false</autoplay>
        <color>Transparent</color>
        <items>
            <item>
                <type>MOVIE</type>
                <devicename>Local</devicename>
                <label>Video</label>
                <name>AMB</name>
                <channel>1</channel>
                <videolayer>10</videolayer>
                <delay>0</delay>
                <duration>0</duration>
                <allowgpi>false</allowgpi>
                <allowremotetriggering>false</allowremotetriggering>
                <remotetriggerid>
                </remotetriggerid>
                <storyid>
                </storyid>
                <transition>CUT</transition>
                <transitionDuration>1</transitionDuration>
                <tween>Linear</tween>
                <direction>RIGHT</direction>
                <seek>0</seek>
                <length>0</length>
                <loop>false</loop>
                <freezeonload>false</freezeonload>
                <triggeronnext>false</triggeronnext>
                <autoplay>false</autoplay>
                <color>Transparent</color>
                <timecode>
                </timecode>
            </item>
            <item>
                <type>MOVIE</type>
                <devicename>Local</devicename>
                <label>Video</label>
                <name>AMB2</name>
                <channel>1</channel>
                <videolayer>10</videolayer>
                <delay>0</delay>
                <duration>0</duration>
                <allowgpi>false</allowgpi>
                <allowremotetriggering>false</allowremotetriggering>
                <remotetriggerid>
                </remotetriggerid>
                <storyid>
                </storyid>
                <transition>CUT</transition>
                <transitionDuration>1</transitionDuration>
                <tween>Linear</tween>
                <direction>RIGHT</direction>
                <seek>0</seek>
                <length>0</length>
                <loop>false</loop>
                <freezeonload>false</freezeonload>
                <triggeronnext>false</triggeronnext>
                <autoplay>false</autoplay>
                <color>Transparent</color>
                <timecode>
                </timecode>
            </item>
        </items>
    </item>
</items>
*/

/*
Multiple groups:
<?xml version="1.0"?>
<items>
    <item>
        <type>GROUP</type>
        <label>Group</label>
        <expanded>true</expanded>
        <channel>1</channel>
        <videolayer>10</videolayer>
        <delay>0</delay>
        <duration>0</duration>
        <allowgpi>false</allowgpi>
        <allowremotetriggering>false</allowremotetriggering>
        <remotetriggerid></remotetriggerid>
        <storyid></storyid>
        <notes></notes>
        <autostep>false</autostep>
        <autoplay>false</autoplay>
        <color>Transparent</color>
        <items>
            <item>
                <type>MOVIE</type>
                <devicename>Local</devicename>
                <label>Video</label>
                <name>AMB</name>
                <channel>1</channel>
                <videolayer>10</videolayer>
                <delay>0</delay>
                <duration>0</duration>
                <allowgpi>false</allowgpi>
                <allowremotetriggering>false</allowremotetriggering>
                <remotetriggerid></remotetriggerid>
                <storyid></storyid>
                <transition>CUT</transition>
                <transitionDuration>1</transitionDuration>
                <tween>Linear</tween>
                <direction>RIGHT</direction>
                <seek>0</seek>
                <length>0</length>
                <loop>false</loop>
                <freezeonload>false</freezeonload>
                <triggeronnext>false</triggeronnext>
                <autoplay>false</autoplay>
                <color>Transparent</color>
                <timecode></timecode>
            </item>
            <item>
                <type>MOVIE</type>
                <devicename>Local</devicename>
                <label>Video</label>
                <name>AMB2</name>
                <channel>1</channel>
                <videolayer>10</videolayer>
                <delay>0</delay>
                <duration>0</duration>
                <allowgpi>false</allowgpi>
                <allowremotetriggering>false</allowremotetriggering>
                <remotetriggerid></remotetriggerid>
                <storyid></storyid>
                <transition>CUT</transition>
                <transitionDuration>1</transitionDuration>
                <tween>Linear</tween>
                <direction>RIGHT</direction>
                <seek>0</seek>
                <length>0</length>
                <loop>false</loop>
                <freezeonload>false</freezeonload>
                <triggeronnext>false</triggeronnext>
                <autoplay>false</autoplay>
                <color>Transparent</color>
                <timecode></timecode>
            </item>
        </items>
    </item>
    <item>
        <type>GROUP</type>
        <label>Group</label>
        <expanded>true</expanded>
        <channel>1</channel>
        <videolayer>10</videolayer>
        <delay>0</delay>
        <duration>0</duration>
        <allowgpi>false</allowgpi>
        <allowremotetriggering>false</allowremotetriggering>
        <remotetriggerid></remotetriggerid>
        <storyid></storyid>
        <notes></notes>
        <autostep>false</autostep>
        <autoplay>false</autoplay>
        <color>Transparent</color>
        <items>
            <item>
                <type>MOVIE</type>
                <devicename>Local</devicename>
                <label>Video</label>
                <name>AMB</name>
                <channel>1</channel>
                <videolayer>10</videolayer>
                <delay>0</delay>
                <duration>0</duration>
                <allowgpi>false</allowgpi>
                <allowremotetriggering>false</allowremotetriggering>
                <remotetriggerid></remotetriggerid>
                <storyid></storyid>
                <transition>CUT</transition>
                <transitionDuration>1</transitionDuration>
                <tween>Linear</tween>
                <direction>RIGHT</direction>
                <seek>0</seek>
                <length>0</length>
                <loop>false</loop>
                <freezeonload>false</freezeonload>
                <triggeronnext>false</triggeronnext>
                <autoplay>false</autoplay>
                <color>Transparent</color>
                <timecode></timecode>
            </item>
            <item>
                <type>MOVIE</type>
                <devicename>Local</devicename>
                <label>Video</label>
                <name>AMB2</name>
                <channel>1</channel>
                <videolayer>10</videolayer>
                <delay>0</delay>
                <duration>0</duration>
                <allowgpi>false</allowgpi>
                <allowremotetriggering>false</allowremotetriggering>
                <remotetriggerid></remotetriggerid>
                <storyid></storyid>
                <transition>CUT</transition>
                <transitionDuration>1</transitionDuration>
                <tween>Linear</tween>
                <direction>RIGHT</direction>
                <seek>0</seek>
                <length>0</length>
                <loop>false</loop>
                <freezeonload>false</freezeonload>
                <triggeronnext>false</triggeronnext>
                <autoplay>false</autoplay>
                <color>Transparent</color>
                <timecode></timecode>
            </item>
        </items>
    </item>
</items>


*/
