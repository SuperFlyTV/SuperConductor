import React, { useCallback, useContext, useMemo, useState } from 'react'
import { INTERNAL_BRIDGE_ID } from '../../../../../models/project/Bridge'
import { Project } from '../../../../../models/project/Project'
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
import { unprotectString } from '@shared/models'
import { BridgeId } from '@shared/api'

export const BridgesPage: React.FC<{ project: Project }> = observer(function BridgesPage({ project }) {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const [isNewBridgeDialogOpen, setNewBridgeDialogOpen] = useState(false)

	const bridgeStatuses = store.appStore.bridgeStatuses

	const internalBridge = useMemo(() => {
		return project.bridges[unprotectString<BridgeId>(INTERNAL_BRIDGE_ID)]
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

	const thereIsOnlyOneBridge = (internalBridge ? 1 : 0) + incomingBridges.length + outgoingBridges.length === 1

	const internalBridgeStatus = bridgeStatuses.get(INTERNAL_BRIDGE_ID)
	return (
		<ProjectPageLayout
			title="Bridges"
			help="Bridges are helper applications that communicate with the SuperConductor. The role of the bridge is to communicate with devices such as CasparCG, Atem, OBS, vMix, etc. SuperConductor sends all the timeline objects and settings to the bridge which then transmits information to different devices. SuperConductor can work with remote bridges using WebSocket protocol or with it's own built-in internal bridge which runs locally."
		>
			<NewBridgeDialog open={isNewBridgeDialogOpen} onClose={() => setNewBridgeDialogOpen(false)} />
			<RoundedSection
				title="Internal Bridge"
				help="This bridge runs internally (locally) by SuperConductor application."
				controls={
					<div className="sc-switch">
						<Toggle
							defaultChecked={project.settings.enableInternalBridge}
							onChange={toggleInternalBridge}
						/>
					</div>
				}
			>
				{internalBridge && project.settings.enableInternalBridge && internalBridgeStatus ? (
					<ScList
						list={[
							{
								id: 'internalBridge',
								header: (
									<BridgeItemHeader
										id="internalBridge"
										bridge={internalBridge}
										bridgeStatus={internalBridgeStatus}
									/>
								),
								content: (
									<BridgeItemContent
										id="internalBridge"
										bridge={internalBridge}
										bridgeStatus={internalBridgeStatus}
										isInternal
									/>
								),
							},
						]}
						openByDefault={thereIsOnlyOneBridge ? ['internalBridge'] : undefined}
					/>
				) : (
					<div className="central">Internal bridge is off.</div>
				)}
			</RoundedSection>

			<RoundedSection title="Incoming Bridges">
				<ScList
					list={incomingBridges.map((bridge) => {
						return {
							id: unprotectString(bridge.id),
							header: (
								<BridgeItemHeader
									id={unprotectString(bridge.id)}
									bridge={bridge}
									bridgeStatus={bridgeStatuses.get(bridge.id)}
								/>
							),
							content: (
								<BridgeItemContent
									id={unprotectString(bridge.id)}
									bridge={bridge}
									bridgeStatus={bridgeStatuses.get(bridge.id)}
								/>
							),
						}
					})}
				/>
				{incomingBridges.length === 0 && <div className="central">There are no incoming bridges.</div>}{' '}
			</RoundedSection>

			<RoundedSection
				title="Outgoing Bridges"
				help="A list of remote bridges that SuperConductor will connect to using WebSocket."
				controls={<TextBtn label="Add" onClick={() => setNewBridgeDialogOpen(true)} />}
			>
				<ScList
					list={outgoingBridges.map((bridge) => {
						return {
							id: unprotectString(bridge.id),
							header: (
								<BridgeItemHeader
									id={unprotectString(bridge.id)}
									bridge={bridge}
									bridgeStatus={bridgeStatuses.get(bridge.id)}
								/>
							),
							content: (
								<BridgeItemContent
									id={unprotectString(bridge.id)}
									bridge={bridge}
									bridgeStatus={bridgeStatuses.get(bridge.id)}
								/>
							),
						}
					})}
				/>

				{outgoingBridges.filter((bridge) => bridgeStatuses.get(bridge.id)).length === 0 && (
					<div className="central">There are no outgoing bridges.</div>
				)}
			</RoundedSection>
		</ProjectPageLayout>
	)
})
