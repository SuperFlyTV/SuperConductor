import { ProtectedString } from '@shared/models'
import type { TimelineKeyframe, TimelineObject } from 'superfly-timeline'
import { XKeysInfo } from 'xkeys'

/** This is a generic data structure which is used to display  */
export interface KeyDisplay {
	/** How much the key should strive for the user's attention */
	attentionLevel: AttentionLevel

	/** Special case, is set when normal key-operations are intercepted (disabled) */
	intercept?: 'areaDefine'

	area?: {
		/** If the area is currently being defined */
		areaInDefinition: boolean
		/** Color of the area */
		color: string
		/** Label/Name of the area */
		areaLabel: string
		/** Label of this key in the area */
		keyLabel: string
		/** A unique id for this area */
		areaId: string
	}

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
		/** A text representing an analog value */
		analogValue?: string
	}

	/** base64-encoded thumbnail */
	thumbnail?: string
}
export enum AttentionLevel {
	/** Actively trying to be ignored */
	IGNORE = -1,
	/** Neutral */
	NEUTRAL = 0,
	/** User should notice me, if looking for me */
	INFO = 1,
	/** User should notice me easilly, even if not looking */
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

export interface PeripheralInfo {
	/** Name of the peripheral device, to be used in GUI display */
	name: string

	/** Other info about the peripheral device, to be used in GUI*/
	gui: PeripheralInfo_StreamDeck | PeripheralInfo_XKeys | PeripheralInfo_MIDI
}

export interface PeripheralInfo_StreamDeck {
	type: PeripheralType.STREAMDECK

	layout: {
		width: number
		height: number
	}
}
export interface PeripheralInfo_XKeys {
	type: PeripheralType.XKEYS

	colCount: number
	rowCount: number
	layout: XKeysInfo['layout']
}
export interface PeripheralInfo_MIDI {
	type: PeripheralType.MIDI
}
export type PeripheralSettingsAny = PeripheralSettingsStreamDeck | PeripheralSettingsXKeys
export interface PeripheralSettingsBase {
	manualConnect: boolean
}
export type PeripheralSettingsStreamDeck = PeripheralSettingsBase
export type PeripheralSettingsXKeys = PeripheralSettingsBase

export interface KnownPeripheral {
	name: string
	type: PeripheralType
	devicePath: string
}

export enum PeripheralType {
	STREAMDECK = 'streamdeck',
	XKEYS = 'xkeys',
	MIDI = 'midi',
}

export interface AnalogValue {
	/** An absolute value */
	absolute: number
	/** A relative value */
	relative: number
	/** Recommendation on what value to use. true=use absolute, false= use relative */
	rAbs: boolean | undefined
}

export type PeripheralId = ProtectedString<'PeripheralId'>
