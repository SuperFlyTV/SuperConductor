import { observer } from 'mobx-react-lite'
import React, { useContext, useState } from 'react'
import { IPCServerContext } from '../../../../contexts/IPCServer'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler'
import { ProjectPageLayout } from '../projectPageLayout/ProjectPageLayout'
import { store } from '../../../../mobx/store'
import Toggle from 'react-toggle'

import './style.scss'
import { computed } from 'mobx'
import { HelpButton } from '../../../inputs/HelpButton/HelpButton'
import { Message } from '../message/Message'

export const ApplicationPage: React.FC = observer(function ApplicationPage() {
	const serverAPI = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const preReleaseAutoUpdate = computed(() => store.appStore?.appData?.preReleaseAutoUpdate ?? false)

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
							If you turn on this, SuperConductor will auto-update to the latest pre-release version.
							<br />
							The pre-release versions are released more frequently and have the latest features, but have
							a higher risk of bugs.
						</Message>
					)}
					<div className="sc-switch">
						<Toggle
							checked={preReleaseAutoUpdate.get()}
							onChange={() => {
								serverAPI
									.updateAppData({
										preReleaseAutoUpdate: !preReleaseAutoUpdate.get(),
									})
									.catch(handleError)
							}}
						/>
					</div>
				</div>
			</div>
		</ProjectPageLayout>
	)
})
