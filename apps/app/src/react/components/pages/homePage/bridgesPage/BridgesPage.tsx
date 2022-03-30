import React, { useCallback, useContext, useMemo } from 'react'
import { Bridge as BridgeType, INTERNAL_BRIDGE_ID } from '../../../../../models/project/Bridge'
import { Project } from '../../../../../models/project/Project'
import { FormControlLabel, Switch } from '@mui/material'
import { Bridge } from '../../../settings/Bridge'
import { literal } from '@shared/lib'
import { DeviceOptionsCasparCG, DeviceType } from 'timeline-state-resolver-types'
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

export const BridgesPage: React.FC<{ project: Project }> = observer(({ project }) => {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)

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

	const addBridge = useCallback(() => {
		const numBridges = Object.keys(project.bridges).length
		const newBridge = literal<BridgeType>({
			id: `bridge${numBridges}`,
			name: `Bridge${numBridges}`,
			outgoing: true,
			url: 'ws://localhost:5401',
			settings: {
				devices: {
					casparcg0: literal<DeviceOptionsCasparCG>({
						type: DeviceType.CASPARCG,
						options: { host: '127.0.0.1', port: 5250 },
					}),
				},
			},
		})

		project.bridges[newBridge.id] = newBridge
		ipcServer.updateProject({ id: project.id, project }).catch(handleError)
	}, [handleError, ipcServer, project])

	const toggleInternalBridge = useCallback(() => {
		project.settings.enableInternalBridge = !project.settings.enableInternalBridge
		ipcServer.updateProject({ id: project.id, project }).catch(handleError)
	}, [handleError, ipcServer, project])

	return (
		<ProjectPageLayout
			title="Bridges"
			help="Bridges are helper applications that communicate with the SuperConductor. The role of the bridge is to communicate with devices such as CasparCG, Atem, OBS, vMix, etc. SuperConductor sends all the timeline objects and settings to the bridge which then transmits information to different devices. SuperConductor communicates with bridges using WebSocket protocol."
		>
			<RoundedSection title="Internal Bridge">
				<div className="rounded-section-message">
					<FormControlLabel
						control={
							<Switch checked={project.settings.enableInternalBridge} onChange={toggleInternalBridge} />
						}
						label="Enable internal bridge"
						labelPlacement="start"
						className="switch"
					/>
				</div>

				{internalBridge && project.settings.enableInternalBridge && bridgeStatuses[INTERNAL_BRIDGE_ID] && (
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
				controls={<TextBtn label="Add" onClick={addBridge} />}
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

				{/* TODO - delete old list */}
				{outgoingBridges.length === 0 && <div className="central">There are no outgoing bridges.</div>}
			</RoundedSection>
		</ProjectPageLayout>
	)
})
