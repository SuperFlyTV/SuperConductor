import React from 'react'
import { observer } from 'mobx-react-lite'
import { PeripheralStatus } from '../../../../../models/project/Peripheral'
import { DefiningArea } from '../../../../../lib/triggers/keyDisplay/keyDisplay'
import { PeripheralType } from '@shared/api'

export const MIDISettings: React.FC<{
	bridgeId: string
	deviceId: string
	peripheral: PeripheralStatus
	definingArea: DefiningArea | null
}> = observer(function XKeysSettings({ peripheral }) {
	if (peripheral.info.gui.type !== PeripheralType.MIDI) throw new Error('Wrong type, expected "midi"')

	return null
})
