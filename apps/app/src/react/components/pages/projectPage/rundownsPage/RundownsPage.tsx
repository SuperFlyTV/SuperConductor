import { observer } from 'mobx-react-lite'
import React, { useContext } from 'react'
import { TrashBtn } from '../../../inputs/TrashBtn'
import { store } from '../../../../mobx/store'

import './rundownsPage.scss'
import { Button } from '@mui/material'
import { IPCServerContext } from '../../../../contexts/IPCServer'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler'

export const RundownsPage: React.FC = observer(() => {
	const serverAPI = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const rundownsStore = store.rundownsStore

	const handleReopen = (rundownId: string) => {
		serverAPI.openRundown({ rundownId }).catch(handleError)
	}

	return (
		<div className="rundowns-page">
			{rundownsStore.closedRundowns.map((closedRundown) => {
				return (
					<div key={closedRundown.rundownId} className="rundown">
						<div className="label">{closedRundown.name}</div>
						<div className="controls">
							<Button
								variant="contained"
								size="medium"
								onClick={() => handleReopen(closedRundown.rundownId)}
							>
								Reopen
							</Button>
							<TrashBtn
								onClick={() => {
									alert('Delete rundown')
								}}
							/>
						</div>
					</div>
				)
			})}
		</div>
	)
})
