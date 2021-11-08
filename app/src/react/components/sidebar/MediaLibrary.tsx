import React, { useEffect, useState } from 'react'
import { AppModel } from '@/models/AppModel'
import { InfoGroup } from './InfoGroup'
import { MediaInfo } from './MediaInfo'
import { Field, Form, Formik, FormikProps } from 'formik'
import { ADD_MEDIA_TO_TIMELINE_CHANNEL, IAddMediaToTimelineChannel, REFRESH_MEDIA_CHANNEL } from '@/ipc/channels'
import { bytesToSize } from '@/lib/bytesToSize'
import { getAllRundowns, getDefaultMappingLayer, getDefaultRundownId } from '@/lib/getDefaults'
import classNames from 'classnames'
const { ipcRenderer } = window.require('electron')

type PropsType = {
	appData: AppModel
}

export const MediaLibrary = (props: PropsType) => {
	const [selectedFilename, setSelectedFilename] = useState<string | undefined>()
	const selectedMedia = props.appData.media.find((item) => item.name === selectedFilename)

	const [refreshing, setRefreshing] = useState(false)

	const defaultRundownId = getDefaultRundownId(props.appData.rundowns)
	const defaultLayer = getDefaultMappingLayer(props.appData.mappings)

	useEffect(() => {
		setRefreshing(false)
		return () => {}
	}, [props])

	return (
		<div className="sidebar media-library-sidebar">
			<InfoGroup
				title="Available media"
				enableRefresh={true}
				refreshActive={refreshing}
				onRefreshClick={() => {
					setRefreshing(true)
					ipcRenderer.send(REFRESH_MEDIA_CHANNEL)
				}}
			>
				<table className="selectable">
					<thead>
						<tr>
							<th></th>
							<th>Name</th>
							<th>Type</th>
							<th>Size</th>
							<th>Duration</th>
						</tr>
					</thead>
					<tbody>
						{props.appData.media.map((item) => {
							return (
								<tr
									key={item.name}
									onClick={() => {
										if (selectedFilename === item.name) {
											setSelectedFilename(undefined)
										} else {
											setSelectedFilename(item.name)
										}
									}}
									className={classNames({ selected: item.name === selectedFilename })}
								>
									<td>
										<img className="thumbnail" src={item.thumbnail} alt={item.name} />
									</td>
									<td>{item.name}</td>
									<td>{item.type}</td>
									<td>{bytesToSize(item.size)}</td>
									<td>{item.duration}</td>
								</tr>
							)
						})}
					</tbody>
				</table>
			</InfoGroup>

			{selectedMedia && (
				<>
					<MediaInfo media={selectedMedia} />
					{defaultRundownId && defaultLayer && (
						<div className="add-to-timeline">
							<Formik
								initialValues={{ rundownId: defaultRundownId, layerId: defaultLayer }}
								onSubmit={(values, actions) => {
									if (!values.rundownId || !values.layerId) {
										return
									}

									const data: IAddMediaToTimelineChannel = {
										rundownId: values.rundownId,
										layerId: values.layerId,
										filename: selectedMedia.name,
									}
									ipcRenderer.send(ADD_MEDIA_TO_TIMELINE_CHANNEL, data)
								}}
							>
								{(fProps: FormikProps<any>) => (
									<Form>
										<div className="label">Add to timeline</div>
										<div className="dropdowns">
											<Field as="select" name="rundownId">
												{getAllRundowns(props.appData.rundowns).map((rd) => {
													if (rd.type === 'rundown') {
														return (
															<option key={rd.id} value={rd.id}>
																{rd.name}
															</option>
														)
													}
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
