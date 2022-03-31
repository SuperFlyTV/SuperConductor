import React, { useCallback, useContext, useMemo, useState } from 'react'
import { INTERNAL_BRIDGE_ID } from '../../../../../models/project/Bridge'
import { Project } from '../../../../../models/project/Project'
import { Bridge } from '../../../settings/Bridge'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler'
import { IPCServerContext } from '../../../../contexts/IPCServer'
import { store } from '../../../../mobx/store'
import { observer } from 'mobx-react-lite'
import { RoundedSection } from '../roundedSection/RoundedSection'
import { TextBtn } from '../../../inputs/textBtn/TextBtn'
import { ScList } from '../scList/ScList'
import { BridgeItemHeader } from '../bridgeItem/BridgeItemHeader'
import { BridgeItemContent } from '../bridgeItem/BridgeItemContent'
import { ProjectPageLayout } from '../projectPageLayout/ProjectPageLayout'
import { NewBridgeDialog } from './NewBridgeDialog'

import Toggle from 'react-toggle'
import 'react-toggle/style.css'

export const BridgesPage: React.FC<{ project: Project }> = observer(({ project }) => {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const [isNewBridgeDialogOpen, setNewBridgeDialogOpen] = useState(false)

	const bridgeStatuses = store.appStore.bridgeStatuses

	const internalBridge = useMemo(() => {
		return project.bridges[INTERNAL_BRIDGE_ID]
	}, [project.bridges])

	const incomingBridges = useMemo(() => {
		return Object.values(project.bridges).filter((bridge) => {
			return !bridge.outgoing && bridge.id !== INTERNAL_BRIDGE_ID
		})
	}, [project.bridges])

	const outgoingBridges = useMemo(() => {
		return Object.values(project.bridges).filter((bridge) => {
			return bridge.outgoing && bridge.id !== INTERNAL_BRIDGE_ID
		})
	}, [project.bridges])

	const toggleInternalBridge = useCallback(() => {
		project.settings.enableInternalBridge = !project.settings.enableInternalBridge
		ipcServer.updateProject({ id: project.id, project }).catch(handleError)
	}, [handleError, ipcServer, project])

	return (
		<ProjectPageLayout
			title="Bridges"
			help="Bridges are helper applications that communicate with the SuperConductor. The role of the bridge is to communicate with devices such as CasparCG, Atem, OBS, vMix, etc. SuperConductor sends all the timeline objects and settings to the bridge which then transmits information to different devices. SuperConductor communicates with bridges using WebSocket protocol."
		>
			<NewBridgeDialog open={isNewBridgeDialogOpen} onClose={() => setNewBridgeDialogOpen(false)} />
			<RoundedSection
				title="Internal Bridge"
				controls={
					<div className="sc-switch">
						<Toggle
							defaultChecked={project.settings.enableInternalBridge}
							onChange={toggleInternalBridge}
						/>
					</div>
				}
			>
				{internalBridge && project.settings.enableInternalBridge && bridgeStatuses[INTERNAL_BRIDGE_ID] ? (
					<ScList
						list={[
							{
								id: 'internalBridge',
								header: (
									<BridgeItemHeader
										id="internalBridge"
										bridge={internalBridge}
										bridgeStatus={bridgeStatuses[INTERNAL_BRIDGE_ID]}
									/>
								),
								content: (
									<BridgeItemContent
										id="internalBridge"
										bridge={internalBridge}
										bridgeStatus={bridgeStatuses[INTERNAL_BRIDGE_ID]}
										isInternal
									/>
								),
							},
						]}
					/>
				) : (
					<div className="central">Internal bridge is off.</div>
				)}
			</RoundedSection>

			<RoundedSection title="Incoming Bridges" help="A list of bridges that have connected to SuperConductor">
				{incomingBridges.map((bridge) => (
					<Bridge key={bridge.id} bridge={bridge} bridgeStatus={bridgeStatuses[bridge.id]} />
				))}
				{incomingBridges.length === 0 && <div className="central">There are no incoming bridges.</div>}{' '}
			</RoundedSection>

			<RoundedSection
				title="Outgoing Bridges"
				help="This is a list of Bridges that SuperConductor will connect to"
				controls={<TextBtn label="Add" onClick={() => setNewBridgeDialogOpen(true)} />}
			>
				<ScList
					list={outgoingBridges
						.filter((bridge) => bridgeStatuses[bridge.id])
						.map((bridge) => {
							return {
								id: bridge.id,
								header: (
									<BridgeItemHeader
										id={bridge.id}
										bridge={bridge}
										bridgeStatus={bridgeStatuses[bridge.id]}
									/>
								),
								content: (
									<BridgeItemContent
										id={bridge.id}
										bridge={bridge}
										bridgeStatus={bridgeStatuses[bridge.id]}
									/>
								),
							}
						})}
				/>

				{outgoingBridges.filter((bridge) => bridgeStatuses[bridge.id]).length === 0 && (
					<div className="central">There are no outgoing bridges.</div>
				)}
			</RoundedSection>
		</ProjectPageLayout>
	)
})
