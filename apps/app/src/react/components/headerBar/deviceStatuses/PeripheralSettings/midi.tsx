import React from 'react'
import { observer } from 'mobx-react-lite'
import { PeripheralStatus } from '../../../../../models/project/Peripheral.js'
import { DefiningArea } from '../../../../../lib/triggers/keyDisplay/keyDisplay.js'
import { BridgeId, PeripheralId, PeripheralType } from '@shared/api'

export const MIDISettings: React.FC<{
	bridgeId: BridgeId
	deviceId: PeripheralId
	peripheral: PeripheralStatus
	definingArea: DefiningArea | null
}> = observer(function MIDISettings({ peripheral }) {
	if (peripheral.info.gui.type !== PeripheralType.MIDI) throw new Error('Wrong type, expected "midi"')

	return null
})
