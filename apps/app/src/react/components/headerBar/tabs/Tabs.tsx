import { observer } from 'mobx-react-lite'
import React, { useContext } from 'react'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler'
import { IPCServerContext } from '../../../contexts/IPCServer'
import { store } from '../../../mobx/store'
import { NewTabBtn } from './NewTabBtn'
import { Tab } from './Tab'

export const Tabs: React.FC<{ onTabDoubleClick: (rundown: any) => void }> = observer((props) => {
	const rundownsStore = store.rundownsStore
	const guiStore = store.guiStore
	const serverAPI = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const handleSelect = (rundownId: string) => {
		store.rundownsStore.setCurrentRundown(rundownId)
		guiStore.currentlyActiveTabSection = 'rundown'
	}

	const handleClose = (rundownId: string) => {
		serverAPI.closeRundown({ rundownId }).catch(handleError)
		const nextRundown = rundownsStore.openRundowns.find((rd) => rd.rundownId !== rundownId)
		if (nextRundown) {
			store.rundownsStore.setCurrentRundown(nextRundown.rundownId)
		} else {
			store.rundownsStore.setCurrentRundown(undefined)
		}
	}

	return (
		<div className="tabs">
			<Tab
				id="project"
				name="Project"
				onClick={() => {
					guiStore.currentlyActiveTabSection = 'project'
					rundownsStore.setCurrentRundown(undefined)
				}}
				disableClose={true}
				active={guiStore.currentlyActiveTabSection === 'project'}
			/>

			{rundownsStore.openRundowns.map((rundown) => {
				return (
					<Tab
						key={rundown.rundownId}
						id={rundown.rundownId}
						name={rundown.name}
						active={
							guiStore.currentlyActiveTabSection === 'rundown' &&
							rundown.rundownId === rundownsStore.currentRundownId
						}
						onClick={() => handleSelect(rundown.rundownId)}
						onDoubleClick={() => props.onTabDoubleClick(rundown)}
						onClose={(id) => handleClose(id)}
					/>
				)
			})}

			<NewTabBtn
				onClick={() => {
					guiStore.currentlyActiveTabSection = 'new-rundown'
				}}
			/>
		</div>
	)
})
