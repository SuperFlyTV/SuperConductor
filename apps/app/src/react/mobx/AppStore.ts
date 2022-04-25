import { makeAutoObservable } from 'mobx'
import { BridgeStatus } from '../../models/project/Bridge'
import { AppData, WindowPosition } from '../../models/App/AppData'
import { IPCServer } from '../api/IPCServer'
import { IPCClient } from '../api/IPCClient'
import { PeripheralStatus } from '../../models/project/Peripheral'
const { ipcRenderer } = window.require('electron')

export class AppStore {
	windowPosition?: WindowPosition = undefined

	version?: {
		seenVersion: string | null
		currentVersion: string
	} = undefined

	bridgeStatuses: { [bridgeId: string]: BridgeStatus } = {}
	peripherals: { [peripheralId: string]: PeripheralStatus } = {}

	serverAPI = new IPCServer(ipcRenderer)
	ipcClient = new IPCClient(ipcRenderer, {
		updateBridgeStatus: (bridgeId: string, status: BridgeStatus | null) =>
			this.updateBridgeStatus(bridgeId, status),
		updatePeripheral: (peripheralId: string, peripheral: PeripheralStatus | null) =>
			this.updatePeripheral(peripheralId, peripheral),
	})

	constructor(init?: AppData) {
		makeAutoObservable(this)

		if (init) {
			this.update(init)
		}
	}

	update(data: AppData) {
		this.windowPosition = data.windowPosition
		this.version = data.version
	}

	updateBridgeStatus(bridgeId: string, status: BridgeStatus | null) {
		const newStatuses = { ...this.bridgeStatuses }
		if (status) {
			newStatuses[bridgeId] = status
		} else {
			delete newStatuses[bridgeId]
		}
		this.bridgeStatuses = newStatuses
	}

	updatePeripheral(peripheralId: string, peripheral: PeripheralStatus | null) {
		const newPeripherals = { ...this.peripherals }
		if (peripheral) {
			newPeripherals[peripheralId] = peripheral
		} else {
			delete newPeripherals[peripheralId]
		}
		this.peripherals = newPeripherals
	}
}
