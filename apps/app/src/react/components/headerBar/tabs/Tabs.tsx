import { observer } from 'mobx-react-lite'
import React, { useContext } from 'react'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler'
import { IPCServerContext } from '../../../contexts/IPCServer'
import { store } from '../../../mobx/store'
import { NewTabBtn } from './newTabBtn/NewTabBtn'
import { Tab } from './tab/Tab'

import './style.scss'
import { AiFillHome } from 'react-icons/ai'

export const Tabs: React.FC<{ onTabDoubleClick: (rundown: any) => void }> = observer((props) => {
	const rundownsStore = store.rundownsStore
	const guiStore = store.guiStore
	const serverAPI = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const handleSelect = (rundownId: string) => {
		store.rundownsStore.setCurrentRundown(rundownId)
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

	const isHomeSelected = guiStore.isHomeSelected()
	const isFirstRundownSelected = rundownsStore.openRundowns[0]?.rundownId === guiStore.activeTabId

	return (
		<div className="tabs">
			<Tab
				id="home"
				name="Home"
				onClick={() => {
					guiStore.goToHome()
				}}
				disableClose={true}
				active={isHomeSelected}
				icon={<AiFillHome />}
				showSeparator={!isHomeSelected && !isFirstRundownSelected}
			/>

			{rundownsStore.openRundowns.map((rundown, idx) => {
				const isThisSelected = rundown.rundownId === guiStore.activeTabId
				const isNextSelected = rundownsStore.openRundowns[idx + 1]?.rundownId === guiStore.activeTabId

				return (
					<>
						<Tab
							key={rundown.rundownId}
							id={rundown.rundownId}
							name={rundown.name}
							active={isThisSelected}
							onClick={() => handleSelect(rundown.rundownId)}
							onDoubleClick={() => props.onTabDoubleClick(rundown)}
							onClose={(id) => handleClose(id)}
							showSeparator={!isThisSelected && !isNextSelected}
						/>
					</>
				)
			})}

			<NewTabBtn
				onClick={() => {
					guiStore.goToNewRundown()
				}}
			/>
		</div>
	)
})
