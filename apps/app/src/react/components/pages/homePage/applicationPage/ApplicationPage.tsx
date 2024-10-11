import { observer } from 'mobx-react-lite'
import React, { useContext, useState } from 'react'
import { IPCServerContext } from '../../../../contexts/IPCServer.js'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler.js'
import { ProjectPageLayout } from '../projectPageLayout/ProjectPageLayout.js'
import { store } from '../../../../mobx/store.js'
import Toggle from 'react-toggle'

import './style.scss'
import { computed } from 'mobx'
import { HelpButton } from '../../../inputs/HelpButton/HelpButton.js'
import { Message } from '../message/Message.js'
import { IntInput } from '../../../inputs/IntInput.js'

export const ApplicationPage: React.FC = observer(function ApplicationPage() {
	const serverAPI = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const appDataSettings = computed(() => {
		const appData = store.appStore?.appData
		return {
			preReleaseAutoUpdate: appData?.preReleaseAutoUpdate ?? appData?.version.currentVersionIsPrerelease,
			guiDecimalCount: appData?.guiDecimalCount ?? 0,
		}
	}).get()

	const [showHelp, setShowHelp] = useState(false)

	return (
		<ProjectPageLayout title={'Application settings'} subtitle="">
			<div>
				<div>
					<label>
						Auto-update to pre-release (alpha) versions
						<HelpButton
							showHelp={showHelp}
							onClick={() => {
								setShowHelp(!showHelp)
							}}
						/>
					</label>

					{showHelp && (
						<Message type="help">
							If you enable this, SuperConductor will auto-update to the latest <b>pre-release version</b>
							.
							<br />
							The pre-release versions are released more frequently and have the latest features, but have
							a higher risk of bugs.
							<br />
							If you disable this, SuperConductor will downgrade you to the latest stable version, if you
							are running a pre-release version.
						</Message>
					)}
					<div className="sc-switch">
						<Toggle
							checked={appDataSettings.preReleaseAutoUpdate}
							onChange={() => {
								serverAPI
									.updateAppData({
										preReleaseAutoUpdate: !appDataSettings.preReleaseAutoUpdate,
									})
									.catch(handleError)
							}}
						/>
					</div>
				</div>
				<div>
					<label>Number of decimals to display in GUI</label>
					<div className="">
						<IntInput
							label="Decimals"
							currentValue={appDataSettings.guiDecimalCount}
							onChange={(value) => {
								serverAPI
									.updateAppData({
										guiDecimalCount: value,
									})
									.catch(handleError)
							}}
							allowUndefined={false}
							caps={[0, 3]}
						/>
					</div>
				</div>
			</div>
		</ProjectPageLayout>
	)
})
