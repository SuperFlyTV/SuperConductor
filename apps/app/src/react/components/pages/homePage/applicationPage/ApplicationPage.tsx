import { observer } from 'mobx-react-lite'
import React, { useContext } from 'react'
import { IPCServerContext } from '../../../../contexts/IPCServer'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler'
import { ProjectPageLayout } from '../projectPageLayout/ProjectPageLayout'
import { store } from '../../../../mobx/store'
import Toggle from 'react-toggle'

import './style.scss'
import { computed } from 'mobx'

export const ApplicationPage: React.FC = observer(function ApplicationPage() {
	const serverAPI = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const preReleaseAutoUpdate = computed(() => store.appStore?.appData?.preReleaseAutoUpdate ?? false)

	return (
		<ProjectPageLayout title={'Application settings'} subtitle="">
			<div>
				<div>
					<label>Auto-update to pre-release (alpha) versions</label>
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
