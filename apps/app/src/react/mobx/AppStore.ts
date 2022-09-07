import { makeAutoObservable } from 'mobx'
import { BridgeDevice, BridgeStatus } from '../../models/project/Bridge'
import { AppData, WindowPosition } from '../../models/App/AppData'
import { IPCServer } from '../api/IPCServer'
import { IPCClient } from '../api/IPCClient'
import { PeripheralStatus } from '../../models/project/Peripheral'
import { ClientSideLogger } from '../api/logger'
const { ipcRenderer } = window.require('electron')

export class AppStore {
	windowPosition?: WindowPosition = undefined

	version?: {
		seenVersion: string | null
		currentVersion: string
	} = undefined

	userAgreement?: string

	bridgeStatuses: { [bridgeId: string]: BridgeStatus } = {}
	peripherals: { [peripheralId: string]: PeripheralStatus } = {}

	serverAPI: IPCServer
	logger: ClientSideLogger
	ipcClient: IPCClient

	allDeviceStatuses: { [deviceId: string]: BridgeDevice } = {}

	constructor(init?: AppData) {
		this.serverAPI = new IPCServer(ipcRenderer)
		this.logger = new ClientSideLogger(this.serverAPI)
		this.ipcClient = new IPCClient(this.logger, ipcRenderer, {
			updateBridgeStatus: (bridgeId: string, status: BridgeStatus | null) =>
				this.updateBridgeStatus(bridgeId, status),
			updatePeripheral: (peripheralId: string, peripheral: PeripheralStatus | null) =>
				this.updatePeripheral(peripheralId, peripheral),
		})

		makeAutoObservable(this)

		if (init) {
			this.update(init)
		}
	}

	update(data: AppData) {
		this.windowPosition = data.windowPosition
		this.version = data.version
		this.userAgreement = data.userAgreement
	}

	updateBridgeStatus(bridgeId: string, status: BridgeStatus | null) {
		const newStatuses = { ...this.bridgeStatuses }
		if (status) {
			newStatuses[bridgeId] = status
		} else {
			delete newStatuses[bridgeId]
		}
		this.bridgeStatuses = newStatuses

		this._updateAllDeviceStatuses()
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

	private _updateAllDeviceStatuses() {
		const allDeviceStatuses: { [deviceId: string]: BridgeDevice } = {}
		for (const bridgeStatus of Object.values(this.bridgeStatuses)) {
			for (const [deviceId, deviceStatus] of Object.entries(bridgeStatus.devices)) {
				allDeviceStatuses[deviceId] = deviceStatus
			}
		}
		this.allDeviceStatuses = allDeviceStatuses
	}
}
