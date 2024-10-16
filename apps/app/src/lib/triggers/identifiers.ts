import { AnyTrigger } from '../../models/rundown/Trigger.js'

/**
 * Translate a trigger's identifier keys from the Sorensen format into the Electron format.
 * The Electron format does not distinguish between left and right modifier keys.
 * See https://www.electronjs.org/docs/latest/api/accelerator for more information.
 */
export function convertSorensenToElectron(identifier: string): string | null {
	const cleanedIdentifier = identifier.replace(/^keyboard-(?:Key)?/, '')
	switch (cleanedIdentifier) {
		case 'ShiftLeft':
		case 'ShiftRight':
			return 'Shift'
		case 'ControlLeft':
		case 'ControlRight':
			return 'Control'
		case 'MetaLeft':
		case 'MetaRight':
			return 'Meta'
		case 'NumpadEnter':
			return 'Enter'
		case 'AltLeft':
		case 'AltRight':
			return 'Alt'
		case 'OSLeft':
		case 'OSRight':
			return process.platform === 'darwin' ? 'CmdOrCtrl' : 'Super'

		case '+':
			return 'Plus'
		case 'Space':
			return 'Space'
		case 'Tab':
			return 'Tab'
		case 'Capslock':
			return 'Capslock'
		case 'Numlock':
			return 'Numlock'
		case 'Scrolllock':
			return 'Scrolllock'
		case 'Backspace':
			return 'Backspace'
		case 'Delete':
			return 'Delete'
		case 'Insert':
			return 'Insert'
		case 'Return':
			return 'Return'
		case 'Enter':
			return 'Enter'
		case 'ArrowUp':
			return 'Up'
		case 'ArrowDown':
			return 'Down'
		case 'ArrowLeft':
			return 'Left'
		case 'ArrowRight':
			return 'Right'
		case 'Home':
			return 'Home'
		case 'End':
			return 'End'
		case 'PageUp':
			return 'PageUp'
		case 'PageDown':
			return 'PageDown'
		case 'Escape':
			return 'Escape'
		case 'VolumeUp':
			return 'VolumeUp'
		case 'VolumeDown':
			return 'VolumeDown'
		case 'VolumeMute':
			return 'VolumeMute'
		case 'MediaNextTrack':
			return 'MediaNextTrack'
		case 'MediaPreviousTrack':
			return 'MediaPreviousTrack'
		case 'MediaStop':
			return 'MediaStop'
		case 'MediaPlayPause':
			return 'MediaPlayPause'
		case 'PrintScreen':
			return 'PrintScreen'

		case 'NumpadDecimal':
			return 'numdec'
		case 'NumpadAdd':
			return 'numadd'
		case 'NumpadSubtract':
			return 'numsub'
		case 'NumpadMultiply':
			return 'nummult'
		case 'NumpadDivide':
			return 'numdiv '

		case 'Minus':
			return '-'
		case 'Slash':
			return '/'
		case 'Period':
			return '.'
		case 'Comma':
			return ','

		case 'Pause':
			// Unsupported
			return null
		default: {
			{
				// Numpad:
				const m = cleanedIdentifier.match(/^Numpad(\d)$/)
				if (m) return `num${m[1]}`
			}
			{
				// Digits:
				const m = cleanedIdentifier.match(/^Digit([0-9])$/)
				if (m) {
					return `${m[1]}`
				}
			}
			{
				// Alphanumeric characters:
				if (cleanedIdentifier.match(/^[a-zA-Z0-9]$/)) {
					return cleanedIdentifier
				}
			}

			{
				// F1-F24:
				if (cleanedIdentifier.match(/^F([1-9]|1[0-9]|2[0-4])$/)) {
					return cleanedIdentifier
				}
			}

			// Any other character needs to be unsupported, to protect against uncaught exceptions
			return null
		}
	}
}

export function triggerIsKeyboard(trigger: AnyTrigger): boolean {
	return trigger.fullIdentifiers.some(identifierIsKeyboard)
}

export function identifierIsKeyboard(identifier: string): boolean {
	return identifier.startsWith('keyboard')
}
