import React, { useContext, useMemo, useState } from 'react'
import { AutoFillMode, AutoFillSettings, AutoFillSortMode, GroupGUI } from '../../../../models/rundown/Group'
import { IPCServerContext } from '../../../contexts/IPCServer'
import { ErrorHandlerContext } from '../../../contexts/ErrorHandler'
import { observer } from 'mobx-react-lite'
import { store } from '../../../mobx/store'
import { BooleanInput } from '../../inputs/BooleanInput'
import { deepClone } from '@shared/lib'
import { TextInput } from '../../inputs/TextInput'
import { sortMappings } from '../../../../lib/TSRMappings'
import { getMappingName, rateLimitIgnore } from '../../../../lib/util'
import { SelectEnumMultiple } from '../../inputs/SelectMultiple'
import { SelectEnum } from '../../inputs/SelectEnum'
import { findAutoFillResources } from '../../../../lib/autoFill'
import { Message } from '../../pages/homePage/message/Message'
import { HelpButton } from '../../inputs/HelpButton/HelpButton'
import { Box } from '@mui/material'
import { CB } from '../../../lib/errorHandling'

export const GroupAutoFillPopover: React.FC<{ rundownId: string; group: GroupGUI }> = observer(
	function GroupButtonAreaPopover({ rundownId, group }) {
		const ipcServer = useContext(IPCServerContext)
		const { handleError } = useContext(ErrorHandlerContext)
		const project = store.projectStore.project
		const resources = store.resourcesAndMetadataStore.resources
		const [showHelp, setShowHelp] = useState(false)

		const triggerHandleAutoFill = useMemo(() => {
			return rateLimitIgnore(
				CB(() => {
					ipcServer.triggerHandleAutoFill().catch(handleError)
				}),
				1000
			)

			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [])

		function onSave(newAutoFill: AutoFillSettings) {
			ipcServer
				.updateGroup({
					rundownId,
					groupId: group.id,
					group: {
						...group,
						autoFill: newAutoFill,
					},
				})
				.then(() => {
					if (newAutoFill.enable) return triggerHandleAutoFill()
				})
				.catch(handleError)
		}

		const autoFill = useMemo(() => {
			return deepClone(group.autoFill)
		}, [group.autoFill])

		const matchedResources = findAutoFillResources(project, autoFill, resources)
		const MAX_VIEW_COUNT = 20
		return (
			<Box sx={{ p: 1 }}>
				<div>
					<div>
						Show help:&nbsp;
						<HelpButton
							showHelp={showHelp}
							onClick={() => {
								setShowHelp(!showHelp)
							}}
						/>
						{showHelp && (
							<Message type="help">
								The Auto-Fill feature automatically adds any matching resources to this Group
							</Message>
						)}
					</div>
					<div>
						<BooleanInput
							label="Enable Auto Fill"
							currentValue={autoFill.enable}
							onChange={(v) => {
								autoFill.enable = v
								onSave(autoFill)
							}}
						/>
					</div>

					<div>
						{showHelp && (
							<Message type="help">Choose one or more layers to put the mathing resources onto</Message>
						)}
						<SelectEnumMultiple
							label="Layers"
							fullWidth
							currentValues={autoFill.layerIds}
							options={sortMappings(project.mappings).map((o) => ({
								value: o.layerId,
								label: getMappingName(o.mapping, o.layerId),
							}))}
							onChange={(vs: string[]) => {
								autoFill.layerIds = vs
								onSave(autoFill)
							}}
							allowUndefined={false}
						/>
					</div>
					<div>
						{showHelp && (
							<Message type="help">
								Limit the search to only include resources matching this filter
							</Message>
						)}
						<TextInput
							label="Filter"
							fullWidth
							currentValue={autoFill.filter}
							onChange={(v) => {
								autoFill.filter = v ?? ''
								onSave(autoFill)
							}}
							allowUndefined={true}
							changeOnKey={true}
						/>
					</div>
					<div>
						{showHelp && (
							<Message type="help">
								Mode select
								<br />
								<b>Replace:</b> Replace existing content in the group with new.{' '}
								<i>
									Please note that Parts can be removed or the order of exiting Parts can change in
									this mode.
								</i>
								<br />
								<b>Append:</b> Only add new content to the group.{' '}
								<i>Ie, no parts are removed and the order of exiting Parts is kept</i>
							</Message>
						)}
						<SelectEnum
							label="Mode"
							fullWidth
							currentValue={autoFill.mode}
							options={AutoFillMode}
							onChange={(v) => {
								autoFill.mode = v
								onSave(autoFill)
							}}
							allowUndefined={false}
						/>
					</div>
					<div>
						<SelectEnum
							label="Sorting Mode"
							fullWidth
							currentValue={autoFill.sortMode}
							options={AutoFillSortMode}
							onChange={(v) => {
								autoFill.sortMode = v
								onSave(autoFill)
							}}
							allowUndefined={false}
						/>
					</div>
				</div>
				<div>
					{matchedResources.length > 0 && (
						<>
							<div>
								<b>Preview of found resources:</b>
							</div>
							{matchedResources.slice(0, MAX_VIEW_COUNT).map((r) => {
								return <div key={r.id}>{r.resource.displayName}</div>
							})}

							{matchedResources.length - MAX_VIEW_COUNT > 0 && (
								<div>
									<i>...and {matchedResources.length - MAX_VIEW_COUNT} more...</i>
								</div>
							)}
						</>
					)}
				</div>
			</Box>
		)
	}
)
