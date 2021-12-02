import React, { useContext, useState } from 'react'
import { InfoGroup } from './InfoGroup'
import { bytesToSize } from '@/lib/bytesToSize'
import { ResourcesContext } from '@/react/contexts/Resources'
import { IPCServerContext } from '@/react/contexts/IPCServer'
import { ResourceAny, ResourceType } from '@/models/resource/resource'
import { assertNever } from '@/lib/lib'
import { ResourceInfo } from './ResourceInfo'
import { ResourecLibraryItem } from './ResourceLibraryItem'

export const ResourceLibrary: React.FC<{}> = ({}) => {
	const ipcServer = useContext(IPCServerContext)
	const resources = useContext(ResourcesContext)

	const [selectedResourceId, setSelectedResourceId] = useState<string | undefined>()

	const selectedResource = selectedResourceId ? resources[selectedResourceId] : undefined

	const [refreshing, setRefreshing] = useState(false)

	// const defaultPart = getDefaultPart(rundown)
	// const defaultLayer = getDefaultMappingLayer(props.appData.mappings)

	// useEffect(() => {
	// 	setRefreshing(false)
	// }, [resources])

	return (
		<div className="sidebar media-library-sidebar">
			<InfoGroup
				title="Available resources"
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
										<img className="thumbnail" src={resource.thumbnail} alt={resource.name} />
									</div>
									<div>{resource.name}</div>
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
							<ResourecLibraryItem
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
							</ResourecLibraryItem>
						)
					})}
			</InfoGroup>

			{selectedResource && (
				<>
					<ResourceInfo resource={selectedResource} />
					{/* {defaultPart && defaultLayer && (
						<div className="add-to-timeline">
							<Formik
								initialValues={{ partId: defaultPart.part.id, layerId: defaultLayer }}
								onSubmit={(values, actions) => {
									if (!values.partId || !values.layerId) {
										return
									}

									const rd = getAllParts(props.appData).find((r) => r.part.id === values.partId)
									if (!rd) return

									ipcServer.addResourceToTimeline({
										groupId: rd.group.id,
										partId: rd.part.id,
										layerId: values.layerId,
										filename: selectedMedia.name,
									})
								}}
							>
								{(fProps: FormikProps<any>) => (
									<Form>
										<div className="label">Add to timeline</div>
										<div className="dropdowns">
											<Field as="select" name="partId">
												{getAllParts(props.appData).map((rd) => {
													return (
														<option key={rd.part.id} value={rd.part.id}>
															{rd.name}
														</option>
													)
												})}
											</Field>
											<Field as="select" name="layerId">
												{props.appData.mappings &&
													Object.keys(props.appData.mappings).map((key) => (
														<option key={key} value={key}>
															{key}
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
					)} */}
				</>
			)}
		</div>
	)
}

// import React, { useContext, useEffect, useState } from 'react'
// import { AppModel } from '@/models/AppModel'
// import { InfoGroup } from './InfoGroup'
// import { Field, Form, Formik, FormikProps } from 'formik'
// import { DataRow } from './DataRow'
// import { getAllParts, getDefaultMappingLayer, getDefaultPart } from '@/lib/getDefaults'
// import classNames from 'classnames'
// import { IPCServerContext } from '@/react/App'

// export const TemplatesLibrary: React.FC<{ appData: AppModel }> = (props) => {
// 	const ipcServer = useContext(IPCServerContext)
// 	const [selectedFilename, setSelectedFilename] = useState<string | undefined>()
// 	const selectedTemplate = props.appData.templates.find((item) => item.name === selectedFilename)

// 	const [refreshing, setRefreshing] = useState(false)

// 	const defaultPart = getDefaultPart(props.appData)
// 	const defaultLayer = getDefaultMappingLayer(props.appData.mappings)

// 	useEffect(() => {
// 		setRefreshing(false)
// 		return () => {}
// 	}, [props])

// 	return (
// 		<div className="sidebar media-library-sidebar">
// 			<InfoGroup
// 				title="Available templates"
// 				enableRefresh={true}
// 				refreshActive={refreshing}
// 				onRefreshClick={() => {
// 					setRefreshing(true)
// 					ipcServer.refreshTemplates()
// 				}}
// 			>
// 				<table className="selectable">
// 					<thead>
// 						<tr>
// 							<th>Name</th>
// 						</tr>
// 					</thead>
// 					<tbody>
// 						{props.appData.templates.map((item, index) => {
// 							return (
// 								<tr
// 									key={index}
// 									onClick={() => {
// 										if (selectedFilename === item.name) {
// 											setSelectedFilename(undefined)
// 										} else {
// 											setSelectedFilename(item.name)
// 										}
// 									}}
// 									className={classNames({ selected: item.name === selectedFilename })}
// 								>
// 									<td>{item.name}</td>
// 								</tr>
// 							)
// 						})}
// 					</tbody>
// 				</table>
// 			</InfoGroup>

// 			{selectedTemplate && (
// 				<>
// 					<InfoGroup title="Template">
// 						<DataRow label="Filename" value={selectedTemplate.name} />
// 					</InfoGroup>
// 					{defaultPart && defaultLayer && (
// 						<div className="add-to-timeline">
// 							<Formik
// 								initialValues={{ partId: defaultPart.part.id, layerId: defaultLayer }}
// 								onSubmit={(values, actions) => {
// 									if (!values.partId || !values.layerId) {
// 										return
// 									}

// 									const rd = getAllParts(props.appData).find((r) => r.part.id === values.partId)
// 									if (!rd) return

// 									ipcServer.addTemplateToTimeline({
// 										groupId: rd.group.id,
// 										partId: rd.part.id,
// 										layerId: values.layerId,
// 										filename: selectedTemplate.name,
// 									})
// 								}}
// 							>
// 								{(fProps: FormikProps<any>) => (
// 									<Form>
// 										<div className="label">Add to timeline</div>
// 										<div className="dropdowns">
// 											<Field as="select" name="partId">
// 												{getAllParts(props.appData).map((rd) => {
// 													return (
// 														<option key={rd.part.id} value={rd.part.id}>
// 															{rd.name}
// 														</option>
// 													)
// 												})}
// 											</Field>
// 											<Field as="select" name="layerId">
// 												{props.appData.mappings &&
// 													Object.keys(props.appData.mappings).map((key) => (
// 														<option key={key} value={key}>
// 															{key}
// 														</option>
// 													))}
// 											</Field>
// 										</div>
// 										<div className="btn-row-right">
// 											<button className="btn form" type="submit">
// 												Add
// 											</button>
// 										</div>
// 									</Form>
// 								)}
// 							</Formik>
// 						</div>
// 					)}
// 				</>
// 			)}
// 		</div>
// 	)
// }
