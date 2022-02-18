import type { TimelineKeyframe, TimelineObject } from 'superfly-timeline'

/** This is a generic data structure which is used to display  */
export interface KeyDisplay {
	/** How much the keye should strive for the user's attention */
	attentionLevel: AttentionLevel

	/** The most important text */
	header?: {
		/** The full version */
		long: string
		/** The shortened version (max 10 characters is recommended)*/
		short?: string
	}
	/** Informational text */
	info?: {
		/** The full version */
		long: string
		/** The shortened version (max 10 characters is recommended)*/
		short?: string
	}
	/** base64-encoded thumbnail */
	thumbnail?: string
}
export enum AttentionLevel {
	/** Actively trying to be ignored */
	IGNORE = -1,
	/** Neutral */
	NEUTRAL = 0,
	/** User should notify me easilly, if looking for me */
	INFO = 1,
	/** User should notify me, even if not looking */
	NOTIFY = 2,
	/** User should notice me immediately */
	ALERT = 3,
}

export interface KeyDisplayTimelineObj extends Omit<TimelineObject, 'content' | 'layer'> {
	content: KeyDisplay
	keyframes?: Array<KeyDisplayTimelineKeyframe>
	layer: string
}
export interface KeyDisplayTimelineKeyframe extends TimelineKeyframe {
	content: Partial<KeyDisplay>
}
export type KeyDisplayTimeline = KeyDisplayTimelineObj[]
