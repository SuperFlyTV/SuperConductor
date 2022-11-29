import { observer } from 'mobx-react-lite'
import React, { useContext, useState } from 'react'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler'
import { IPCServerContext } from '../../../contexts/IPCServer'
import { store } from '../../../mobx/store'
import { NewTabBtn } from './newTabBtn/NewTabBtn'
import { Tab } from './tab/Tab'

import './style.scss'
import { AiFillHome } from 'react-icons/ai'
import { ConfirmationDialog } from '../../util/ConfirmationDialog'

export const Tabs: React.FC<{ onTabDoubleClick: (rundown: any) => void }> = observer(function Tabs(props) {
	const rundownsStore = store.rundownsStore
	const guiStore = store.guiStore
	const serverAPI = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)
	const [closeConfirmationDialogOpen, setCloseConfirmationDialogOpen] = useState(false)
	const [rundownToClose, setRundownToClose] = useState<{
		rundownId: string
		name: string
	}>()

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
			guiStore.goToHome()
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
					<Tab
						key={rundown.rundownId}
						id={rundown.rundownId}
						name={rundown.name}
						active={isThisSelected}
						onClick={() => handleSelect(rundown.rundownId)}
						onDoubleClick={() => props.onTabDoubleClick(rundown)}
						// eslint-disable-next-line @typescript-eslint/no-misused-promises
						onClose={async () => {
							try {
								setRundownToClose(rundown)

								const isPlaying = await serverAPI.isRundownPlaying({ rundownId: rundown.rundownId })

								// If the rundown is currently playing, prompt the user for confirmation. before closing it.
								if (isPlaying) {
									setCloseConfirmationDialogOpen(true)
								} else {
									handleClose(rundown.rundownId)
								}
							} catch (error) {
								handleError(error)
							}
						}}
						showSeparator={!isThisSelected && !isNextSelected}
					/>
				)
			})}

			<NewTabBtn
				onClick={() => {
					guiStore.goToNewRundown()
				}}
			/>

			<ConfirmationDialog
				open={closeConfirmationDialogOpen}
				onAccepted={() => {
					if (rundownToClose) {
						handleClose(rundownToClose.rundownId)
					}
					setCloseConfirmationDialogOpen(false)
				}}
				onDiscarded={() => {
					setCloseConfirmationDialogOpen(false)
				}}
				acceptLabel="Close"
				title="Close Rundown"
			>
				<p>
					Are you sure you wish to close{' '}
					{rundownToClose ? `the rundown "${rundownToClose.name}"` : 'this rundown'}?
					<br />
					Anything currently playing in this rundown will be stopped!
				</p>
			</ConfirmationDialog>
		</div>
	)
})
