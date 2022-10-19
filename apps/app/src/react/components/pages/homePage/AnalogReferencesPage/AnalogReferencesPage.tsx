import React, { useContext, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { store } from '../../../../mobx/store'

import { ProjectPageLayout } from '../projectPageLayout/ProjectPageLayout'
import { RoundedSection } from '../roundedSection/RoundedSection'
import { ScList } from '../scList/ScList'
import { ScListItemLabel } from '../scList/ScListItemLabel'

import './style.scss'
import { TriggerPill } from '../../../inputs/EditTrigger'
import { AnalogPill } from '../../../inputs/EditAnalog'
import { TextBtn } from '../../../inputs/textBtn/TextBtn'
import { shortID } from '../../../../../lib/util'
import { DatastoreAction } from '../../../../../models/project/Project'
import { IPCServerContext } from '../../../../contexts/IPCServer'
import { ErrorHandlerContext } from '../../../../contexts/ErrorHandler'

export const AnalogReferencesPage: React.FC = observer(function AnalogReferencesPage() {
	return (
		<ProjectPageLayout title="Analog References">
			<AnalogReferences />
		</ProjectPageLayout>
	)
})

const AnalogReferences: React.FC = observer(function AnalogReferences() {
	const ipcServer = useContext(IPCServerContext)
	const { handleError } = useContext(ErrorHandlerContext)

	const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | undefined>()

	const project = store.projectStore.project

	return (
		<>
			<RoundedSection title="Analog References" help="">
				<ScList
					list={Object.entries(project.datastoreActions).map(([datastoreKey, datastoreActions]) => {
						return {
							id: datastoreKey,
							header: (
								<div className="rundown-header-item datastore-action">
									<ScListItemLabel title={datastoreActions.label} />

									<div className="triggers ">
										{datastoreActions.analog && <AnalogPill analog={datastoreActions.analog} />}
									</div>

									{/* <div className="controls">
										<TriggerBtn
											onTrigger={(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
												setTriggersSubmenuPopover({
													anchor: event.currentTarget,
													triggerAction: actionType as ApplicationTrigger['action'],
													triggers: appAction.triggers,
												})
											}}
											locked={false}
											triggerCount={appAction.triggers.length}
											anyGlobalTriggerFailed={anyGlobalTriggerFailed}
										/>
									</div> */}
								</div>
							),
						}
					})}
					openByDefault={newlyCreatedKey ? [newlyCreatedKey] : undefined}
				/>
				<div className="bottom-controls">
					<TextBtn
						label="Add new Analog reference"
						onClick={() => {
							const defaultDatastoreAction: DatastoreAction = {
								label: 'New Analog reference',
								modified: Date.now(),
								value: 0,
								analog: null,
							}

							const datastoreKey = shortID()
							project.datastoreActions[datastoreKey] = defaultDatastoreAction

							setNewlyCreatedKey(datastoreKey)

							ipcServer.updateProject({ id: project.id, project }).catch(handleError)
						}}
					/>
				</div>
			</RoundedSection>
		</>
	)
})
