import React, { useEffect, useState } from 'react'
import { AppModel } from '@/models/AppModel'
import { InfoGroup } from './InfoGroup'
import { Field, Form, Formik, FormikProps } from 'formik'
import {
	ADD_TEMPLATE_TO_TIMELINE_CHANNEL,
	IAddTemplateToTimelineChannel,
	REFRESH_TEMPLATES_CHANNEL,
} from '@/ipc/channels'
import { DataRow } from './DataRow'
import { getAllRundowns, getDefaultMappingLayer, getDefaultRundown } from '@/lib/getDefaults'
import classNames from 'classnames'
const { ipcRenderer } = window.require('electron')

export const TemplatesLibrary: React.FC<{ appData: AppModel }> = (props) => {
	const [selectedFilename, setSelectedFilename] = useState<string | undefined>()
	const selectedTemplate = props.appData.templates.find((item) => item.name === selectedFilename)

	const [refreshing, setRefreshing] = useState(false)

	const defaultRundown = getDefaultRundown(props.appData)
	const defaultLayer = getDefaultMappingLayer(props.appData.mappings)

	useEffect(() => {
		setRefreshing(false)
		return () => {}
	}, [props])

	return (
		<div className="sidebar media-library-sidebar">
			<InfoGroup
				title="Available templates"
				enableRefresh={true}
				refreshActive={refreshing}
				onRefreshClick={() => {
					setRefreshing(true)
					ipcRenderer.send(REFRESH_TEMPLATES_CHANNEL)
				}}
			>
				<table className="selectable">
					<thead>
						<tr>
							<th>Name</th>
						</tr>
					</thead>
					<tbody>
						{props.appData.templates.map((item, index) => {
							return (
								<tr
									key={index}
									onClick={() => {
										if (selectedFilename === item.name) {
											setSelectedFilename(undefined)
										} else {
											setSelectedFilename(item.name)
										}
									}}
									className={classNames({ selected: item.name === selectedFilename })}
								>
									<td>{item.name}</td>
								</tr>
							)
						})}
					</tbody>
				</table>
			</InfoGroup>

			{selectedTemplate && (
				<>
					<InfoGroup title="Template">
						<DataRow label="Filename" value={selectedTemplate.name} />
					</InfoGroup>
					{defaultRundown && defaultLayer && (
						<div className="add-to-timeline">
							<Formik
								initialValues={{ rundownId: defaultRundown.rundown.id, layerId: defaultLayer }}
								onSubmit={(values, actions) => {
									if (!values.rundownId || !values.layerId) {
										return
									}

									const rd = getAllRundowns(props.appData).find((r) => r.rundown.id === values.rundownId)
									if (!rd) return

									const data: IAddTemplateToTimelineChannel = {
										groupId: rd.group.id,
										rundownId: rd.rundown.id,
										layerId: values.layerId,
										filename: selectedTemplate.name,
									}
									ipcRenderer.send(ADD_TEMPLATE_TO_TIMELINE_CHANNEL, data)
								}}
							>
								{(fProps: FormikProps<any>) => (
									<Form>
										<div className="label">Add to timeline</div>
										<div className="dropdowns">
											<Field as="select" name="rundownId">
												{getAllRundowns(props.appData).map((rd) => {
													return (
														<option key={rd.rundown.id} value={rd.rundown.id}>
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
					)}
				</>
			)}
		</div>
	)
}
