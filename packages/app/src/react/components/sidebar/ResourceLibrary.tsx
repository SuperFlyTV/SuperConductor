import React, { useContext, useState } from 'react'
import { InfoGroup } from './InfoGroup'
import { bytesToSize } from '../../../lib/bytesToSize'
import { ResourcesContext } from '../../contexts/Resources'
import { IPCServerContext } from '../../contexts/IPCServer'
import { RundownContext } from '../../contexts/Rundown'
import { ProjectContext } from '../../contexts/Project'
import { ResourceAny, ResourceType } from '../../../models/resource/resource'
import { assertNever } from '../../../lib/lib'
import { ResourceInfo } from './ResourceInfo'
import { ResourceLibraryItem } from './ResourceLibraryItem'
import { Part } from '../../../models/rundown/Part'
import { Field, Form, Formik, FormikProps } from 'formik'
import { findPartInRundown } from '../../../lib/util'
import { Rundown } from '../../../models/rundown/Rundown'
import { Group } from '../../../models/rundown/Group'
import { ResourceLibraryItemThumbnail } from './ResourceLibraryItemThumbnail'

export const ResourceLibrary: React.FC = () => {
	const ipcServer = useContext(IPCServerContext)
	const resources = useContext(ResourcesContext)
	const rundown = useContext(RundownContext)
	const project = useContext(ProjectContext)

	const defaultPart = rundown.groups[0]?.parts[0] as Part | undefined
	const defaultLayer = Object.keys(project.mappings)[0] as string | undefined

	const [selectedResourceId, setSelectedResourceId] = useState<string | undefined>()
	const selectedResource = selectedResourceId ? resources[selectedResourceId] : undefined

	const [refreshing, setRefreshing] = useState(false)

	return (
		<div className="sidebar media-library-sidebar">
			<InfoGroup
				title="Available Assets"
				enableRefresh={true}
				refreshActive={refreshing}
				onRefreshClick={async () => {
					setRefreshing(true)
					try {
						await ipcServer.refreshResources()
					} catch (err) {
						console.error(err)
					}
					setRefreshing(false)
				}}
			>
				{Object.values(resources)
					.map<[ResourceAny, JSX.Element]>((resource) => {
						if (resource.resourceType === ResourceType.CASPARCG_MEDIA) {
							return [
								resource,
								<>
									<div>
										<ResourceLibraryItemThumbnail resource={resource} />
									</div>
									<div className="resource__name" title={resource.name}>
										{resource.name}
									</div>
									<div>{resource.type}</div>
									<div>{bytesToSize(resource.size)}</div>
									<div>{resource.duration}</div>
								</>,
							]
						} else if (resource.resourceType === ResourceType.CASPARCG_TEMPLATE) {
							return [
								resource,
								<>
									<div>{resource.name}</div>
								</>,
							]
						} else if (resource.resourceType === ResourceType.CASPARCG_SERVER) {
							return [resource, <></>]
						} else {
							assertNever(resource)
							return [resource, <></>]
						}
					})
					.map((d: [ResourceAny, JSX.Element]) => {
						const resource: ResourceAny = d[0]
						const child: JSX.Element = d[1]

						return (
							<>
								<ResourceLibraryItem
									key={resource.id}
									resource={resource}
									selected={resource.id === selectedResourceId}
									onClick={() => {
										if (selectedResourceId === resource.id) {
											setSelectedResourceId(undefined)
										} else {
											setSelectedResourceId(resource.id)
										}
									}}
								>
									{child}
								</ResourceLibraryItem>
								<hr key={resource.id + '_hr'} />
							</>
						)
					})}
			</InfoGroup>

			{selectedResource && (
				<>
					<ResourceInfo resource={selectedResource} />
					{defaultPart && defaultLayer && (
						<div className="add-to-timeline">
							<Formik
								initialValues={{ partId: defaultPart.id, layerId: defaultLayer }}
								onSubmit={(values) => {
									if (!values.partId || !values.layerId) {
										return
									}

									const part = findPartInRundown(rundown, values.partId)
									if (!part) return

									ipcServer
										.addResourceToTimeline({
											rundownId: rundown.id,
											groupId: part.group.id,
											partId: part.part.id,
											layerId: values.layerId,
											resourceId: selectedResource.id,
										})
										.catch(console.error)
								}}
							>
								{(_fProps: FormikProps<any>) => (
									<Form>
										<div className="label">Add to timeline</div>
										<div className="dropdowns">
											<Field as="select" name="partId">
												{getAllPartsInRundown(rundown).map((p) => {
													return (
														<option key={p.part.id} value={p.part.id}>
															{p.group.transparent
																? p.part.name
																: `${p.group.name}: ${p.part.name}`}
														</option>
													)
												})}
											</Field>
											<Field as="select" name="layerId">
												{Object.entries(project.mappings).map(([layerId, mapping]) => (
													<option key={layerId} value={layerId}>
														{mapping.layerName || layerId}
													</option>
												))}
											</Field>
										</div>
										<div className="btn-row-right">
											<button className="btn form" type="submit">
												Add
											</button>
										</div>
									</Form>
								)}
							</Formik>
						</div>
					)}
				</>
			)}
		</div>
	)
}

function getAllPartsInRundown(rundown: Rundown): { part: Part; group: Group }[] {
	const parts: { part: Part; group: Group }[] = []
	for (const group of rundown.groups) {
		for (const part of group.parts) {
			parts.push({ part, group })
		}
	}
	return parts
}
