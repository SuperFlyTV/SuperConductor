import got from 'got'
import os from 'os'
import { app } from 'electron'
import { CURRENT_VERSION } from './bridgeHandler'
import { StorageHandler } from './storageHandler'
import { hash } from '../lib/util'
import { LoggerLike } from '@shared/api'
import { USER_AGREEMENT_VERSION } from '../lib/userAgreement'

/*
  This file handles the sending of usage statistics.


*/

export class TelemetryHandler {
	private userHasAgreed = false
	private _disableTelemetry = false

	private storedErrors = new Set<string>()

	constructor(private log: LoggerLike, private storageHandler: StorageHandler) {}

	private get enabled(): boolean {
		return (
			// User has agreed to the user agreement:
			this.userHasAgreed &&
			// Telemetry is not disabled:
			!this._disableTelemetry &&
			// Don't send updates when in development mode:
			app.isPackaged
		)
	}
	/** This is called when the user has agreed to the user agreement */
	setUserHasAgreed() {
		this.userHasAgreed = true

		this.triggerSendTelemetry()
	}
	disableTelemetry() {
		this._disableTelemetry = true
	}

	/**
	 * Create a report of usage statistics on application startup
	 */
	onStartup(): void {
		this.storeTelemetry({
			reportType: 'application-start',
			...this.standardData(),
		})
	}
	/**
	 * Create a report when user clicks accept on the user agreement
	 */
	onAcceptUserAgreement(): void {
		this.storeTelemetry({
			reportType: 'accept-user-agreement',
			userAgreementVersion: USER_AGREEMENT_VERSION,
			...this.standardData(),
		})
	}

	onError(error: string, stack?: string): void {
		// Make sure we only store a certain error once, to avoid flooding:
		const errorHash = hash(error)
		if (!this.storedErrors.has(errorHash)) {
			this.storedErrors.add(errorHash)

			if (stack) {
				// Remove everything before "app.asar", as that can contain information about the local file system:
				// Tested on data:
				// "   at hashCode (C:\\Users\\USERNAME\\AppData\\Local\\Programs\\superconductor\\resources\\app.asar\\dist\\lib\\util.js:209:26)"
				// "   at Generator.next (<anonymous>)"
				// "   at (C:\\Users\\USERNAME\\AppData\\Local\\Programs\\superconductor\\resources\\app.asar\\dist\\lib\\util.js:209:26)"
				stack = stack.replace(/^(\W+at )(\w+)?.+(app\.asar)/gm, '$1$2 LOCAL_PATH')
			}

			this.storeTelemetry({
				reportType: 'application-error',
				error: error,
				errorStack: stack,
				...this.standardData(),
			})
		}
	}

	/** Return a few data-points that are sent with every report */
	private standardData(): { [key: string]: string } {
		const date = new Date()
		return {
			date: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`, // YYYY-MM-DD
			version: CURRENT_VERSION,
			osType: os.type(), // Which Operating system, eg "Windows_NT"
			osRelease: os.release(), // Which OS version, eg "10.0.14393"
			osPlatform: os.platform(), // Which OS platform, eg "win32"
		}
	}

	/** Store a statistics report for later send */
	private storeTelemetry(report: any): void {
		// Don't do anything if the user hasn't agreed
		if (this.enabled) {
			this.storageHandler.addTelemetryReport(report).catch(this.log.error)

			this.triggerSendTelemetry()
		} else if (!app.isPackaged) {
			this.log.info('TELEMETRY: ' + JSON.stringify(report))
		}
	}

	/**
	 * Retrieve stored statistics and send them:
	 */
	private async sendTelemetry(): Promise<void> {
		if (!this.enabled) return

		const reports = await this.storageHandler.retrieveTelemetryReports()

		const notSentStatistics: string[] = []
		let errorCount = 0
		for (const report of reports) {
			if (!report) continue
			try {
				JSON.parse(report)
			} catch (err) {
				// if it's not parseable, don't send it
				continue
			}

			// If there are errors, don't flood with requests:
			if (errorCount < 3) {
				try {
					await got
						// .post('http://superconductor-statistics/superconductor/reportUsageStatistics', {
						// .post('http://localhost:2500/superconductor/reportUsageStatistics', {
						.post(
							// 'https://faas-ams3-2a2df116.doserverless.co/api/v1/web/fn-7ba9c1fc-f987-4993-b324-a86c98928fcb/telemetry/insert',
							'https://faas-ams3-2a2df116.doserverless.co/api/v1/web/fn-7ba9c1fc-f987-4993-b324-a86c98928fcb/telemetry/insert',
							{
								json: {
									report: report,
								},
							}
						)
						.json()
				} catch (error: any) {
					// For a strange reason we get an error even though it all works

					if (!`${error.response?.body}`.match(/Incomplete web action path/)) {
						// There was an error when reporting, put it back to the queue to be sent later:
						notSentStatistics.push(report)
						errorCount++

						if (error.response) this.log.error(error.response?.body)
						else this.log.error(error)
					}
				}
			} else {
				notSentStatistics.push(report)
			}
		}

		if (notSentStatistics.length > 0) {
			await this.storageHandler.setTelemetryReport(notSentStatistics)
		} else {
			await this.storageHandler.clearTelemetryReport()
		}
	}

	private sendUsageStatisticsTimeout: NodeJS.Timer | undefined = undefined
	private triggerSendTelemetry() {
		if (!this.enabled) return
		if (!this.sendUsageStatisticsTimeout) {
			this.sendUsageStatisticsTimeout = setTimeout(() => {
				this.sendUsageStatisticsTimeout = undefined
				this.sendTelemetry().catch(this.log.error)
			}, 1000)
		}
	}
}
