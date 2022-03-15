import { makeAutoObservable } from 'mobx'
import { BridgeStatus } from '../../models/project/Bridge'
import { AppData, WindowPosition } from '../../models/App/AppData'
import { IPCServer } from '../api/IPCServer'
import { IPCClient } from '../api/IPCClient'
import { Peripheral } from '../../models/project/Peripheral'
const { ipcRenderer } = window.require('electron')

export class AppStore {
	windowPosition?: WindowPosition = undefined

	bridgeStatuses: { [bridgeId: string]: BridgeStatus } = {}
	peripherals: { [peripheralId: string]: Peripheral } = {}

	serverAPI = new IPCServer(ipcRenderer)
	ipcClient = new IPCClient(ipcRenderer, {
		updateBridgeStatus: (bridgeId: string, status: BridgeStatus | null) =>
			this.updateBridgeStatus(bridgeId, status),
		updatePeripheral: (peripheralId: string, peripheral: Peripheral | null) =>
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

	updatePeripheral(peripheralId: string, peripheral: Peripheral | null) {
		const newPeripherals = { ...this.peripherals }
		if (peripheral) {
			newPeripherals[peripheralId] = peripheral
		} else {
			delete newPeripherals[peripheralId]
		}
		this.peripherals = newPeripherals
	}
}
