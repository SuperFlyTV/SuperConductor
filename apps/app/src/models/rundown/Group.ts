import { DateTimeObject, RepeatingSettingsAny } from '../../lib/timeLib'
import { GroupPreparedPlayData } from '../GUI/PreparedPlayhead'
import { Part } from './Part'

export interface GroupBase {
	id: string
	name: string

	/** A transparent group is one that only has a single part, ie "hidden from the user" */
	transparent: boolean

	oneAtATime: boolean
	autoPlay: boolean
	loop: boolean
	disabled?: boolean
	locked?: boolean

	playoutMode: PlayoutMode

	/** Contains info for the Auto-Fill feature */
	autoFill: AutoFillSettings

	/** Contains info for when playoutMode is in SCHEDULE */
	schedule: ScheduleSettings

	/** Data related to the playout of the group */
	playout: {
		/** Map of the part(s) currently playing */
		playingParts: {
			[partId: string]: {
				/** Timestamp of when the part started playing (unix timestamp) */
				startTime: number

				/** If set, startTime is disregarded and the part is instead paused at the pauseTime (0 is start of the part) [ms] */
				pauseTime: number | undefined
			}
		}
	}

	/** This is populated by the backend, as the timeline is build. */
	preparedPlayData: GroupPreparedPlayData | null
}

export interface Group extends GroupBase {
	parts: Part[]
}
export interface GroupGUI extends GroupBase {
	partIds: string[]
}
export function isGroup(group: GroupBase): group is Group {
	return !!(group as any as Group).parts
}
export function isGroupGUI(group: GroupBase): group is GroupGUI {
	return !!(group as any as GroupGUI).partIds
}

export interface AutoFillSettings {
	/** True when Auto-fill is enabled */
	enable: boolean

	/** Which layers to put resources on, in that order */
	layerIds: string[]
	/**  */
	filter: string

	mode: AutoFillMode
	sortMode: AutoFillSortMode
}
export enum AutoFillMode {
	/** Replace existing content in the group with new (the order of exiting Parts can change) */
	REPLACE = 'replace',
	/** Only add new content to the group (the order of exiting Parts is kept), no parts are removed */
	APPEND = 'append',
}
export enum AutoFillSortMode {
	NAME_ASC = 'name_asc',
	NAME_DESC = 'name_desc',
	ADDED_ASC = 'added_asc',
	ADDED_DESC = 'added_desc',
	MODIFIED_ASC = 'modified_asc',
	MODIFIED_DESC = 'modified_desc',
}
export enum PlayoutMode {
	NORMAL = 'normal',
	SCHEDULE = 'schedule',
	// EXPRESSION = 'expression', // <-- not implemented yet
}
export interface ScheduleSettings {
	/** timestamp */
	startTime?: DateTimeObject
	repeating: RepeatingSettingsAny
}
