import { AnyTrigger } from '../../models/rundown/Trigger'

/**
 * Translate a trigger's identifier keys from the Sorensen format into the Electron format.
 * The Electron format does not distinguish between left and right modifier keys.
 * See https://www.electronjs.org/docs/latest/api/accelerator for more information.
 */
export function convertSorensenToElectron(identifier: string): string {
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
		default:
			return cleanedIdentifier
	}
}

export function triggerIsKeyboard(trigger: AnyTrigger): boolean {
	return trigger.fullIdentifiers.some(identifierIsKeyboard)
}

export function identifierIsKeyboard(identifier: string): boolean {
	return identifier.startsWith('keyboard')
}
