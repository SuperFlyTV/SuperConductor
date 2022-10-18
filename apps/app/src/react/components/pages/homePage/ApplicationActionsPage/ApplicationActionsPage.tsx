import React, { useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { Popover } from '@mui/material'
import { store } from '../../../../mobx/store'
import { useMemoComputedObject } from '../../../../mobx/lib'

import { ProjectPageLayout } from '../projectPageLayout/ProjectPageLayout'
import { RoundedSection } from '../roundedSection/RoundedSection'
import { ScList } from '../scList/ScList'
import { ScListItemLabel } from '../scList/ScListItemLabel'

import { ApplicationTrigger } from '../../../../../models/rundown/Trigger'
import { TriggerBtn } from '../../../inputs/TriggerBtn/TriggerBtn'
import { ApplicationTriggersSubmenu } from '../../../rundown/GroupView/part/TriggersSubmenu/TriggersSubmenu'
import { TriggerPill } from '../../../../components/inputs/EditTrigger'

import './style.scss'
import { convertSorensenToElectron } from '../../../../../lib/triggers/identifiers'

export const ApplicationActionsPage: React.FC = observer(function ProjectPage() {
	return (
		<ProjectPageLayout title="Triggers">
			<ApplicationActions />
		</ProjectPageLayout>
	)
})

const ApplicationActions: React.FC = observer(function ApplicationActions() {
	// Triggers Submenu
	const [triggersSubmenuPopover, setTriggersSubmenuPopover] = React.useState<{
		anchor: HTMLButtonElement
		triggerAction: ApplicationTrigger['action']
		triggers: ApplicationTrigger[]
	} | null>(null)
	const closeTriggersSubmenu = useCallback(() => {
		setTriggersSubmenuPopover(null)
	}, [])

	const appDataTriggers = useMemoComputedObject(() => store.appStore.appData?.triggers ?? {}, [])

	const failedGlobalShortcuts = useMemoComputedObject(() => {
		return store.triggersStore.failedGlobalTriggers
	}, [store.triggersStore.failedGlobalTriggers])

	const appActions: {
		[Key in ApplicationTrigger['action']]: {
			label: string
			triggers: ApplicationTrigger[]
		}
	} = {
		stop: { triggers: [], label: 'Stop' },
		play: { triggers: [], label: 'Play' },
		playStop: { triggers: [], label: 'PlayStop' },
		pause: { triggers: [], label: 'Pause' },
		previous: { triggers: [], label: 'Previous' },
		next: { triggers: [], label: 'Next' },
		delete: { triggers: [], label: 'Delete' },
	}
	for (const [triggerAction0, triggers] of Object.entries(appDataTriggers)) {
		const triggerAction = triggerAction0 as ApplicationTrigger['action']
		if (appActions[triggerAction]) {
			appActions[triggerAction].triggers = triggers
		}
	}

	return (
		<>
			<RoundedSection
				title="Actions"
				help='The Application Actions are executed in the context of the GUI. For example, a "Play" will play the currently selected
		Group(s) or Part(s).'
			>
				<ScList
					list={Object.entries(appActions).map(([actionType, appAction]) => {
						const anyGlobalTriggerFailed = appAction.triggers.some((trigger) =>
							failedGlobalShortcuts.has(
								trigger.fullIdentifiers.map(convertSorensenToElectron).filter(Boolean).join('+')
							)
						)
						return {
							id: actionType,
							header: (
								<div className="rundown-header-item application-actions">
									<ScListItemLabel title={appAction.label} />

									<div className="triggers ">
										{appAction.triggers.map((trigger, index) => (
											<TriggerPill key={index} trigger={trigger} />
										))}
									</div>

									<div className="controls">
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
									</div>
								</div>
							),
						}
					})}
				/>
			</RoundedSection>
			<Popover
				open={!!triggersSubmenuPopover}
				anchorEl={triggersSubmenuPopover?.anchor}
				onClose={closeTriggersSubmenu}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'left',
				}}
			>
				{triggersSubmenuPopover && (
					<ApplicationTriggersSubmenu
						triggerAction={triggersSubmenuPopover.triggerAction}
						triggers={appDataTriggers[triggersSubmenuPopover.triggerAction] ?? []}
					/>
				)}
			</Popover>
		</>
	)
})
