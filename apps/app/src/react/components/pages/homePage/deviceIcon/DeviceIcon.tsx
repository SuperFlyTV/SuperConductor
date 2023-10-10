import React from 'react'
import { DeviceType } from 'timeline-state-resolver-types'
import { PeripheralType } from '@shared/api'

import casparcg from '../../../../../img/casparcg.png'
import vmix from '../../../../../img/vmix.png'
import obs from '../../../../../img/obs.png'
import atem from '../../../../../img/atem.png'
import hyperdeck from '../../../../../img/hyperdeck.png'
import streamdeck from '../../../../../img/streamdeck.png'
import xkeys from '../../../../../img/xkeys.png'
import midi from '../../../../../img/midi.png'
import './style.scss'

export const DeviceIcon: React.FC<{ type: DeviceType | PeripheralType | undefined }> = (props) => {
	const type = props.type

	let iconElement = null
	switch (type) {
		case DeviceType.CASPARCG:
			iconElement = <img src={casparcg} alt="CasparCG" />
			break
		case DeviceType.VMIX:
			iconElement = <img src={vmix} alt="vMix" />
			break
		case DeviceType.OBS:
			iconElement = <img src={obs} alt="OBS" />
			break
		case DeviceType.ATEM:
			iconElement = <img src={atem} alt="Atem" />
			break
		case DeviceType.OSC:
			iconElement = <span>OSC</span>
			break
		case DeviceType.HTTPSEND:
			iconElement = <span>HTTP</span>
			break
		case DeviceType.TCPSEND:
			iconElement = <span>TCP</span>
			break
		case DeviceType.TRICASTER:
			iconElement = <span>TC</span>
			break
		case DeviceType.HYPERDECK:
			iconElement = <img src={hyperdeck} alt="HyperDeck" />
			break
		case PeripheralType.STREAMDECK:
			iconElement = <img src={streamdeck} alt="Stream Deck" />
			break
		case PeripheralType.XKEYS:
			iconElement = <img src={xkeys} alt="X-keys" />
			break
		case PeripheralType.MIDI:
			iconElement = <img src={midi} alt="MIDI" />
			break
		case undefined:
			iconElement = <span>?</span>
			break
		default:
			iconElement = <span>{props.type}</span>
			break
	}

	return <div className="device-icon">{iconElement}</div>
}
