import { makeAutoObservable } from 'mobx'
import { BridgeDevice, BridgeStatus } from '../../models/project/Bridge'
import { AppData } from '../../models/App/AppData'
import { IPCServer } from '../api/IPCServer'
import { IPCClient } from '../api/IPCClient'
import { PeripheralStatus } from '../../models/project/Peripheral'
import { ClientSideLogger } from '../api/logger'
import { setConstants } from '../constants'
import { BridgeId } from '@shared/api'
import { TSRDeviceId, protectString } from '@shared/models'
import { BridgePeripheralId } from '@shared/lib'
const { ipcRenderer } = window.require('electron')

export class AppStore {
	bridgeStatuses = new Map<BridgeId, BridgeStatus>()
	peripherals = new Map<BridgePeripheralId, PeripheralStatus>()

	serverAPI: IPCServer
	logger: ClientSideLogger
	ipcClient: IPCClient

	allDeviceStatuses = new Map<TSRDeviceId, BridgeDevice>()

	private _data?: AppData = undefined

	constructor(init?: AppData) {
		this.serverAPI = new IPCServer(ipcRenderer)
		this.logger = new ClientSideLogger(this.serverAPI)
		this.ipcClient = new IPCClient(this.logger, ipcRenderer, {
			updateBridgeStatus: (bridgeId: BridgeId, status: BridgeStatus | null) =>
				this.updateBridgeStatus(bridgeId, status),
			updatePeripheral: (peripheralId: BridgePeripheralId, peripheral: PeripheralStatus | null) =>
				this.updatePeripheral(peripheralId, peripheral),
		})

		makeAutoObservable(this)

		if (init) {
			this.update(init)
		}
	}
	get appData(): AppData | undefined {
		return this._data
	}

	update(appData: AppData): void {
		this._data = appData

		setConstants({
			decimalCount: appData.guiDecimalCount,
		})
	}

	updateBridgeStatus(bridgeId: BridgeId, status: BridgeStatus | null): void {
		if (status) {
			this.bridgeStatuses.set(bridgeId, status)
		} else {
			this.bridgeStatuses.delete(bridgeId)
		}

		this._updateAllDeviceStatuses()
	}

	updatePeripheral(peripheralId: BridgePeripheralId, peripheral: PeripheralStatus | null): void {
		// const newPeripherals = { ...this.peripherals }
		if (peripheral) {
			this.peripherals.set(peripheralId, peripheral)
		} else {
			this.peripherals.delete(peripheralId)
		}
	}

	private _updateAllDeviceStatuses() {
		for (const bridgeStatus of this.bridgeStatuses.values()) {
			for (const [deviceId, deviceStatus] of Object.entries<BridgeDevice>(bridgeStatus.devices)) {
				this.allDeviceStatuses.set(protectString<TSRDeviceId>(deviceId), deviceStatus)
			}
		}
	}
}
