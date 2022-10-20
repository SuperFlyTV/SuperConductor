import React from 'react'
import { observer } from 'mobx-react-lite'
import { PeripheralStatus } from '../../../../../models/project/Peripheral'
import { DefiningArea } from '../../../../../lib/triggers/keyDisplay/keyDisplay'

export const MIDISettings: React.FC<{
	bridgeId: string
	deviceId: string
	peripheral: PeripheralStatus
	definingArea: DefiningArea | null
}> = observer(function XKeysSettings({ peripheral }) {
	if (peripheral.info.gui.type !== 'midi') throw new Error('Wrong type, expected "midi"')

	return null
})
